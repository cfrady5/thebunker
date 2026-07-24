"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole, type CurrentUser } from "@/lib/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import {
  createRefund as createSquareRefund,
  createGiftCardPaymentLink,
  isSquareConfigured,
} from "@/lib/square/server";
import {
  generateGiftCardCode,
  giftCardLast4,
  hashGiftCardCode,
} from "@/lib/gift-cards/logic";
import { SITE_URL } from "@/lib/seo/metadata";
import type { BusinessMode, StaffRole } from "@/types";

export interface ActionResult {
  ok: boolean;
  message: string;
}

const NOT_CONFIGURED: ActionResult = {
  ok: false,
  message: "Database not configured.",
};

async function withRole(
  roles: StaffRole[],
): Promise<{ user: CurrentUser; admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>> } | ActionResult> {
  let user: CurrentUser;
  try {
    user = await requireRole(roles);
  } catch {
    return { ok: false, message: "You don't have permission to do that." };
  }
  const admin = createSupabaseAdminClient();
  if (!admin) return NOT_CONFIGURED;
  return { user, admin };
}

function isError(
  ctx: Awaited<ReturnType<typeof withRole>>,
): ctx is ActionResult {
  return "ok" in ctx;
}

async function audit(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  actorProfileId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  afterData?: unknown,
) {
  await admin.from("audit_logs").insert({
    actor_profile_id: actorProfileId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    after_data: afterData ?? null,
  });
}

// ---------- Site settings ----------

const BUSINESS_MODES: BusinessMode[] = [
  "pre_opening",
  "reservations_open",
  "fully_operational",
  "temporarily_closed",
];

export async function setBusinessMode(mode: string): Promise<ActionResult> {
  const ctx = await withRole(["owner", "manager"]);
  if (isError(ctx)) return ctx;
  if (!BUSINESS_MODES.includes(mode as BusinessMode)) {
    return { ok: false, message: "Invalid business mode." };
  }

  const { error } = await ctx.admin
    .from("site_settings")
    .upsert({ key: "business_mode", value: JSON.stringify(mode) });
  if (error) return { ok: false, message: error.message };

  await audit(ctx.admin, ctx.user.profile.id, "set_business_mode", "site_settings", "business_mode", { mode });
  revalidatePath("/", "layout");
  return { ok: true, message: `Business mode set to ${mode.replace(/_/g, " ")}.` };
}

const heroSchema = z.object({
  eyebrow: z.string().trim().min(1).max(120),
  headline: z.string().trim().min(1).max(120),
  subheadline: z.string().trim().min(1).max(500),
});

export async function updateHero(raw: z.infer<typeof heroSchema>): Promise<ActionResult> {
  const ctx = await withRole(["owner", "manager", "marketing"]);
  if (isError(ctx)) return ctx;
  const parsed = heroSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Check the hero fields." };

  const { error } = await ctx.admin
    .from("site_settings")
    .upsert({ key: "hero", value: parsed.data });
  if (error) return { ok: false, message: error.message };

  await audit(ctx.admin, ctx.user.profile.id, "update_hero", "site_settings", "hero", parsed.data);
  revalidatePath("/", "layout");
  return { ok: true, message: "Homepage hero updated." };
}

const facilitySchema = z.object({
  phone: z.string().trim().max(25).nullable(),
  email: z.string().trim().email().nullable().or(z.literal("").transform(() => null)),
  address_line1: z.string().trim().max(120).nullable(),
  postal_code: z.string().trim().max(12).nullable(),
});

export async function updateFacilityInfo(
  raw: z.infer<typeof facilitySchema>,
): Promise<ActionResult> {
  const ctx = await withRole(["owner", "manager"]);
  if (isError(ctx)) return ctx;
  const parsed = facilitySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Check the contact fields." };

  const { data: existing } = await ctx.admin
    .from("site_settings")
    .select("value")
    .eq("key", "facility")
    .maybeSingle();

  const merged = { ...((existing?.value as object) ?? {}), ...parsed.data };
  const { error } = await ctx.admin
    .from("site_settings")
    .upsert({ key: "facility", value: merged });
  if (error) return { ok: false, message: error.message };

  await audit(ctx.admin, ctx.user.profile.id, "update_facility", "site_settings", "facility", merged);
  revalidatePath("/", "layout");
  return { ok: true, message: "Facility info updated." };
}

// ---------- Bookings ----------

export async function setBookingStatus(
  bookingId: string,
  status: "checked_in" | "completed" | "no_show" | "cancelled_by_staff",
): Promise<ActionResult> {
  const ctx = await withRole(["owner", "manager", "front_desk"]);
  if (isError(ctx)) return ctx;

  const { error } = await ctx.admin
    .from("bookings")
    .update({ status })
    .eq("id", bookingId)
    .in("status", ["confirmed", "checked_in", "payment_pending"]);
  if (error) return { ok: false, message: error.message };

  await audit(ctx.admin, ctx.user.profile.id, `booking_${status}`, "bookings", bookingId);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  return { ok: true, message: `Booking marked ${status.replace(/_/g, " ")}.` };
}

export async function issueRefund(
  bookingId: string,
  reason: string,
): Promise<ActionResult> {
  const ctx = await withRole(["owner", "manager"]);
  if (isError(ctx)) return ctx;

  const { data: bookingRow } = await ctx.admin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();
  if (!bookingRow) return { ok: false, message: "Booking not found." };

  const booking = bookingRow as {
    stripe_payment_intent_id: string | null;
    square_payment_id: string | null;
    total_cents: number;
    status: string;
  };

  try {
    if (booking.square_payment_id && isSquareConfigured()) {
      await createSquareRefund({
        idempotencyKey: `staff-refund-${bookingId}`,
        paymentId: booking.square_payment_id,
        amountCents: booking.total_cents,
        reason: reason.slice(0, 190) || "Staff refund",
      });
    } else if (booking.stripe_payment_intent_id && getStripe()) {
      await getStripe()!.refunds.create({
        payment_intent: booking.stripe_payment_intent_id,
        reason: "requested_by_customer",
        metadata: { staff_reason: reason.slice(0, 200) },
      });
    } else {
      return { ok: false, message: "No payment on file for this booking." };
    }
  } catch (err) {
    console.error("admin refund failed:", err);
    return {
      ok: false,
      message: "Refund failed — check the Square dashboard and try again.",
    };
  }

  await ctx.admin.from("bookings").update({ status: "refunded" }).eq("id", bookingId);
  await audit(ctx.admin, ctx.user.profile.id, "issue_refund", "bookings", bookingId, { reason });
  revalidatePath("/admin/bookings");
  return { ok: true, message: "Refund issued and booking updated." };
}

const walkInSchema = z.object({
  bay_id: z.string().uuid(),
  starts_at: z.string().datetime({ offset: true }),
  duration_minutes: z.number().int().min(30).max(240),
  player_count: z.number().int().min(1).max(12),
  name: z.string().trim().min(1).max(120),
});

export async function createWalkIn(raw: z.infer<typeof walkInSchema>): Promise<ActionResult> {
  const ctx = await withRole(["owner", "manager", "front_desk"]);
  if (isError(ctx)) return ctx;
  const parsed = walkInSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Check the walk-in details." };

  const starts = new Date(parsed.data.starts_at);
  const ends = new Date(starts.getTime() + parsed.data.duration_minutes * 60_000);

  const { error } = await ctx.admin.from("bookings").insert({
    bay_id: parsed.data.bay_id,
    booking_type: "walk_in",
    starts_at: starts.toISOString(),
    ends_at: ends.toISOString(),
    player_count: parsed.data.player_count,
    status: "confirmed",
    notes: `Walk-in: ${parsed.data.name}`,
  });
  if (error) {
    if (error.message.includes("bookings_no_overlap")) {
      return { ok: false, message: "That bay is already booked for that time." };
    }
    return { ok: false, message: error.message };
  }

  await audit(ctx.admin, ctx.user.profile.id, "create_walk_in", "bookings", null, parsed.data);
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/bookings");
  return { ok: true, message: "Walk-in created." };
}

// ---------- Bays & blackouts ----------

export async function setBayStatus(
  bayId: string,
  updates: { active?: boolean; maintenance_status?: "operational" | "degraded" | "offline" },
): Promise<ActionResult> {
  const ctx = await withRole(["owner", "manager"]);
  if (isError(ctx)) return ctx;

  const { error } = await ctx.admin
    .from("simulator_bays")
    .update(updates)
    .eq("id", bayId);
  if (error) return { ok: false, message: error.message };

  await audit(ctx.admin, ctx.user.profile.id, "update_bay", "simulator_bays", bayId, updates);
  revalidatePath("/admin/bays");
  return { ok: true, message: "Bay updated." };
}

const blackoutSchema = z.object({
  bay_id: z.string().uuid().nullable(),
  starts_at: z.string().datetime({ offset: true }),
  ends_at: z.string().datetime({ offset: true }),
  reason: z.string().trim().max(200),
  blackout_type: z.enum(["maintenance", "private_event", "league", "staff_hold", "other"]),
});

export async function createBlackout(
  raw: z.infer<typeof blackoutSchema>,
): Promise<ActionResult> {
  const ctx = await withRole(["owner", "manager", "front_desk"]);
  if (isError(ctx)) return ctx;
  const parsed = blackoutSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Check the blackout details." };
  if (new Date(parsed.data.ends_at) <= new Date(parsed.data.starts_at)) {
    return { ok: false, message: "End time must be after start time." };
  }

  const { error } = await ctx.admin.from("bay_blackouts").insert({
    ...parsed.data,
    created_by: ctx.user.profile.id,
  });
  if (error) return { ok: false, message: error.message };

  await audit(ctx.admin, ctx.user.profile.id, "create_blackout", "bay_blackouts", null, parsed.data);
  revalidatePath("/admin/blackouts");
  return { ok: true, message: "Blackout created." };
}

export async function deleteBlackout(id: string): Promise<ActionResult> {
  const ctx = await withRole(["owner", "manager", "front_desk"]);
  if (isError(ctx)) return ctx;
  const { error } = await ctx.admin.from("bay_blackouts").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  await audit(ctx.admin, ctx.user.profile.id, "delete_blackout", "bay_blackouts", id);
  revalidatePath("/admin/blackouts");
  return { ok: true, message: "Blackout removed." };
}

// ---------- Menu ----------

export async function setMenuItemAvailability(
  itemId: string,
  available: boolean,
): Promise<ActionResult> {
  const ctx = await withRole(["owner", "manager", "kitchen", "marketing"]);
  if (isError(ctx)) return ctx;

  const { error } = await ctx.admin
    .from("menu_items")
    .update({ available })
    .eq("id", itemId);
  if (error) return { ok: false, message: error.message };

  await audit(ctx.admin, ctx.user.profile.id, "menu_availability", "menu_items", itemId, { available });
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  return { ok: true, message: available ? "Item available." : "Item marked unavailable." };
}

const menuItemSchema = z.object({
  id: z.string().uuid().optional(),
  category_id: z.string().uuid("Pick a category."),
  name: z.string().trim().min(1, "Enter a name.").max(120),
  description: z.string().trim().max(600).optional().nullable(),
  price_cents: z.number().int().min(0).max(1_000_000),
  dietary_labels: z.array(z.string().trim().min(1)).max(12),
  allergen_notes: z.string().trim().max(400).optional().nullable(),
  featured: z.boolean(),
  available: z.boolean(),
});

export async function saveMenuItem(
  raw: z.infer<typeof menuItemSchema>,
): Promise<ActionResult> {
  const ctx = await withRole(["owner", "manager", "kitchen", "marketing"]);
  if (isError(ctx)) return ctx;

  const parsed = menuItemSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid item." };
  }
  const input = parsed.data;
  const fields = {
    category_id: input.category_id,
    name: input.name,
    description: input.description?.trim() || null,
    price_cents: input.price_cents,
    dietary_labels: input.dietary_labels,
    allergen_notes: input.allergen_notes?.trim() || null,
    featured: input.featured,
    available: input.available,
  };

  if (input.id) {
    const { error } = await ctx.admin.from("menu_items").update(fields).eq("id", input.id);
    if (error) return { ok: false, message: error.message };
    await audit(ctx.admin, ctx.user.profile.id, "menu_item_update", "menu_items", input.id, fields);
  } else {
    // Place new items at the end of their category.
    const { data: last } = await ctx.admin
      .from("menu_items")
      .select("sort_order")
      .eq("category_id", input.category_id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sort_order = ((last?.sort_order as number | undefined) ?? 0) + 1;
    const { data: created, error } = await ctx.admin
      .from("menu_items")
      .insert({ ...fields, sort_order })
      .select("id")
      .single();
    if (error) return { ok: false, message: error.message };
    await audit(ctx.admin, ctx.user.profile.id, "menu_item_create", "menu_items", created?.id ?? null, fields);
  }

  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  return { ok: true, message: input.id ? "Item saved." : "Item added." };
}

export async function deleteMenuItem(itemId: string): Promise<ActionResult> {
  const ctx = await withRole(["owner", "manager"]);
  if (isError(ctx)) return ctx;

  const { error } = await ctx.admin.from("menu_items").delete().eq("id", itemId);
  if (error) return { ok: false, message: error.message };

  await audit(ctx.admin, ctx.user.profile.id, "menu_item_delete", "menu_items", itemId);
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  return { ok: true, message: "Item deleted." };
}

// ---------- Gift cards ----------

export interface GiftCardIssueResult extends ActionResult {
  /** Raw code — shown to staff once, never stored. */
  code?: string;
  /** Square-hosted checkout URL when paying online. */
  paymentUrl?: string;
}

const giftCardIssueSchema = z.object({
  amount_cents: z.number().int().min(500, "Minimum $5.").max(2_000_000),
  assign_email: z.string().trim().email().optional().or(z.literal("")),
  recipient_name: z.string().trim().max(120).optional(),
  recipient_email: z.string().trim().email().optional().or(z.literal("")),
  personal_message: z.string().trim().max(500).optional(),
  delivery_date: z.string().trim().optional(),
  payment_method: z.enum(["square_link", "cash", "card", "comp", "other"]),
  payment_reference: z.string().trim().max(120).optional(),
});

export async function issueGiftCard(
  raw: z.infer<typeof giftCardIssueSchema>,
): Promise<GiftCardIssueResult> {
  const ctx = await withRole(["owner", "manager"]);
  if (isError(ctx)) return ctx;

  const parsed = giftCardIssueSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const input = parsed.data;

  // Link the card to a customer account when an email is supplied.
  let assignedProfileId: string | null = null;
  const assignEmail = input.assign_email?.trim();
  if (assignEmail) {
    const { data: profile } = await ctx.admin
      .from("profiles")
      .select("id")
      .ilike("email", assignEmail)
      .maybeSingle();
    if (!profile) {
      return {
        ok: false,
        message: `No account found for ${assignEmail}. Check the email, or leave it blank to issue an unassigned card.`,
      };
    }
    assignedProfileId = profile.id as string;
  }

  const code = generateGiftCardCode();
  const last4 = giftCardLast4(code);
  const recipientEmail = input.recipient_email?.trim() || assignEmail || null;
  const payViaSquare = input.payment_method === "square_link";

  // Square-link cards stay pending until the customer pays; recorded
  // payments (cash / card / comp) fund the card immediately.
  const status: "pending_payment" | "active" = payViaSquare ? "pending_payment" : "active";

  let paymentUrl: string | undefined;
  let squarePaymentId: string | null =
    input.payment_method === "card" ? input.payment_reference?.trim() || null : null;

  if (payViaSquare) {
    if (!isSquareConfigured()) {
      return {
        ok: false,
        message: "Square isn't configured, so an online payment link can't be created. Record the payment method instead.",
      };
    }
    try {
      const link = await createGiftCardPaymentLink({
        idempotencyKey: randomUUID(),
        referenceId: last4,
        description: `The Bunker gift card — $${(input.amount_cents / 100).toFixed(2)}`,
        amountCents: input.amount_cents,
        buyerEmail: recipientEmail ?? undefined,
        redirectUrl: `${SITE_URL}/account`,
      });
      paymentUrl = link.url;
      squarePaymentId = link.paymentLinkId;
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : "Couldn't create a Square payment link.",
      };
    }
  }

  const { data: card, error } = await ctx.admin
    .from("gift_cards")
    .insert({
      code_hash: hashGiftCardCode(code),
      code_last4: last4,
      purchaser_profile_id: assignedProfileId,
      assigned_profile_id: assignedProfileId,
      issued_by: ctx.user.profile.id,
      recipient_name: input.recipient_name?.trim() || null,
      recipient_email: recipientEmail,
      original_balance_cents: input.amount_cents,
      remaining_balance_cents: input.amount_cents,
      status,
      personal_message: input.personal_message?.trim() || null,
      delivery_date: input.delivery_date?.trim() || null,
      square_payment_id: squarePaymentId,
    })
    .select("id")
    .single();
  if (error) return { ok: false, message: error.message };

  const cardId = card?.id as string | undefined;

  // Ledger: record the purchase, and a payment row for funded cards.
  if (cardId) {
    await ctx.admin.from("gift_card_transactions").insert({
      gift_card_id: cardId,
      amount_cents: input.amount_cents,
      transaction_type: "purchase",
    });
    if (!payViaSquare) {
      await ctx.admin.from("payments").insert({
        profile_id: assignedProfileId,
        amount_cents: input.amount_cents,
        status: "succeeded",
        payment_type: "gift_card",
        square_payment_id: squarePaymentId,
      });
    }
  }

  await audit(ctx.admin, ctx.user.profile.id, "gift_card_issue", "gift_cards", cardId ?? null, {
    amount_cents: input.amount_cents,
    payment_method: input.payment_method,
    assigned: Boolean(assignedProfileId),
  });
  revalidatePath("/admin/gift-cards");

  const where = assignEmail ? ` assigned to ${assignEmail}` : "";
  return {
    ok: true,
    message: payViaSquare
      ? `Gift card created${where}. Send the customer the Square payment link to fund it.`
      : `Gift card issued${where}. Give the customer the code below — it won't be shown again.`,
    code,
    paymentUrl,
  };
}

export async function setGiftCardStatus(
  id: string,
  status: "active" | "disabled",
): Promise<ActionResult> {
  const ctx = await withRole(["owner", "manager"]);
  if (isError(ctx)) return ctx;

  const { error } = await ctx.admin
    .from("gift_cards")
    .update({ status })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  await audit(ctx.admin, ctx.user.profile.id, "gift_card_status", "gift_cards", id, { status });
  revalidatePath("/admin/gift-cards");
  return {
    ok: true,
    message: status === "active" ? "Gift card activated." : "Gift card disabled.",
  };
}

// ---------- Private event inquiries ----------

const INQUIRY_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "tentative_hold",
  "confirmed",
  "completed",
  "lost",
] as const;

export async function setInquiryStatus(
  inquiryId: string,
  status: string,
  internalNote?: string,
): Promise<ActionResult> {
  const ctx = await withRole(["owner", "manager", "marketing"]);
  if (isError(ctx)) return ctx;
  if (!INQUIRY_STATUSES.includes(status as (typeof INQUIRY_STATUSES)[number])) {
    return { ok: false, message: "Invalid status." };
  }

  const updates: Record<string, unknown> = { status };
  if (internalNote?.trim()) {
    const { data: existing } = await ctx.admin
      .from("private_event_inquiries")
      .select("internal_notes")
      .eq("id", inquiryId)
      .single();
    const stamp = new Date().toISOString().slice(0, 10);
    updates.internal_notes = [
      existing?.internal_notes,
      `[${stamp}] ${internalNote.trim()}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  const { error } = await ctx.admin
    .from("private_event_inquiries")
    .update(updates)
    .eq("id", inquiryId);
  if (error) return { ok: false, message: error.message };

  await audit(ctx.admin, ctx.user.profile.id, "inquiry_status", "private_event_inquiries", inquiryId, { status });
  revalidatePath("/admin/private-events");
  return { ok: true, message: "Inquiry updated." };
}

// ---------- Contact inbox ----------

const CONTACT_STATUSES = ["new", "read", "archived"] as const;

export async function setContactMessageStatus(
  id: string,
  status: string,
): Promise<ActionResult> {
  const ctx = await withRole(["owner", "manager", "marketing"]);
  if (isError(ctx)) return ctx;
  if (!CONTACT_STATUSES.includes(status as (typeof CONTACT_STATUSES)[number])) {
    return { ok: false, message: "Invalid status." };
  }

  const { error } = await ctx.admin
    .from("contact_messages")
    .update({ status, handled_by: ctx.user.profile.id })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  await audit(
    ctx.admin,
    ctx.user.profile.id,
    `contact_message_${status}`,
    "contact_messages",
    id,
    { status },
  );
  revalidatePath("/admin/inbox");
  return { ok: true, message: "Message updated." };
}

// ---------- Discount codes ----------

const discountCreateSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "At least 3 characters")
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, dashes and underscores only"),
  discount_type: z.enum(["percentage", "fixed_amount"]),
  value: z.number().int().positive(),
  usage_limit: z.number().int().positive().nullable().optional(),
  starts_at: z.string().optional(),
  expires_at: z.string().optional(),
});

export async function createDiscountCode(
  raw: z.infer<typeof discountCreateSchema>,
): Promise<ActionResult> {
  const ctx = await withRole(["owner", "manager"]);
  if (isError(ctx)) return ctx;
  const parsed = discountCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the details." };
  }
  const d = parsed.data;
  if (d.discount_type === "percentage" && (d.value < 1 || d.value > 100)) {
    return { ok: false, message: "Percentage must be between 1 and 100." };
  }

  const { error } = await ctx.admin.from("discount_codes").insert({
    code: d.code.toUpperCase(),
    discount_type: d.discount_type,
    value: d.value,
    usage_limit: d.usage_limit ?? null,
    starts_at: d.starts_at ? new Date(d.starts_at).toISOString() : null,
    expires_at: d.expires_at ? new Date(d.expires_at).toISOString() : null,
    active: true,
    created_by: ctx.user.profile.id,
  });
  if (error) {
    if (error.code === "23505" || /duplicate|unique/i.test(error.message)) {
      return { ok: false, message: "That code already exists." };
    }
    return { ok: false, message: error.message };
  }

  await audit(ctx.admin, ctx.user.profile.id, "create_discount", "discount_codes", null, {
    code: d.code.toUpperCase(),
  });
  revalidatePath("/admin/discounts");
  return { ok: true, message: "Discount code created." };
}

export async function logDiscountUse(
  codeId: string,
  note?: string,
): Promise<ActionResult> {
  const ctx = await withRole(["owner", "manager", "front_desk"]);
  if (isError(ctx)) return ctx;

  const { data: code } = await ctx.admin
    .from("discount_codes")
    .select("usage_count, usage_limit, active")
    .eq("id", codeId)
    .single();
  if (!code) return { ok: false, message: "Code not found." };
  if (!code.active) return { ok: false, message: "That code is inactive." };
  if (code.usage_limit != null && code.usage_count >= code.usage_limit) {
    return { ok: false, message: "That code has reached its usage limit." };
  }

  const { error: redErr } = await ctx.admin.from("discount_redemptions").insert({
    discount_code_id: codeId,
    redeemed_by: ctx.user.profile.id,
    note: note?.trim() || null,
  });
  if (redErr) return { ok: false, message: redErr.message };

  await ctx.admin
    .from("discount_codes")
    .update({ usage_count: code.usage_count + 1 })
    .eq("id", codeId);

  await audit(ctx.admin, ctx.user.profile.id, "redeem_discount", "discount_codes", codeId);
  revalidatePath("/admin/discounts");
  return { ok: true, message: "Use recorded." };
}

export async function setDiscountActive(
  codeId: string,
  active: boolean,
): Promise<ActionResult> {
  const ctx = await withRole(["owner", "manager"]);
  if (isError(ctx)) return ctx;

  const { error } = await ctx.admin
    .from("discount_codes")
    .update({ active })
    .eq("id", codeId);
  if (error) return { ok: false, message: error.message };

  await audit(
    ctx.admin,
    ctx.user.profile.id,
    active ? "activate_discount" : "deactivate_discount",
    "discount_codes",
    codeId,
  );
  revalidatePath("/admin/discounts");
  return { ok: true, message: active ? "Code activated." : "Code deactivated." };
}

// ---------- Leagues / programs / events status ----------

export async function setEntityStatus(
  table: "leagues" | "programs" | "events",
  id: string,
  status: string,
): Promise<ActionResult> {
  const ctx = await withRole(["owner", "manager", "marketing"]);
  if (isError(ctx)) return ctx;

  const { error } = await ctx.admin.from(table).update({ status }).eq("id", id);
  if (error) return { ok: false, message: error.message };

  await audit(ctx.admin, ctx.user.profile.id, `${table}_status`, table, id, { status });
  revalidatePath(`/admin/${table}`);
  revalidatePath("/", "layout");
  return { ok: true, message: "Status updated." };
}
