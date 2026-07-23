"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole, type CurrentUser } from "@/lib/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import { createRefund as createSquareRefund, isSquareConfigured } from "@/lib/square/server";
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
