"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/permissions";
import { householdMemberSchema, profileSchema } from "@/lib/validation/schemas";

export interface ActionResult {
  ok: boolean;
  message: string;
}

const NOT_CONFIGURED: ActionResult = {
  ok: false,
  message: "Accounts aren't connected yet on this preview site.",
};

type ProfileInput = z.infer<typeof profileSchema>;

export async function updateProfile(raw: ProfileInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Please check the highlighted fields." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NOT_CONFIGURED;

  const d = parsed.data;
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: d.first_name,
      last_name: d.last_name,
      phone: d.phone || null,
      handedness: d.handedness ?? null,
      skill_level: d.skill_level ?? null,
      date_of_birth: d.date_of_birth || null,
      accessibility_notes: d.accessibility_notes || null,
      marketing_email_consent: d.marketing_email_consent,
      marketing_sms_consent: d.marketing_sms_consent,
    })
    .eq("id", user.profile.id);

  if (error) {
    console.error("profile update failed:", error.message);
    return { ok: false, message: "We couldn't save your changes. Please try again." };
  }

  revalidatePath("/account/profile");
  return { ok: true, message: "Profile saved." };
}

type HouseholdMemberInput = z.infer<typeof householdMemberSchema>;

export async function addHouseholdMember(
  raw: HouseholdMemberInput,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const parsed = householdMemberSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Please check the highlighted fields." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NOT_CONFIGURED;

  // Get or create the caller's household (RLS restricts to own rows).
  let householdId: string;
  const { data: existing } = await supabase
    .from("households")
    .select("id")
    .eq("owner_profile_id", user.profile.id)
    .maybeSingle();

  if (existing) {
    householdId = existing.id;
  } else {
    const { data: created, error: createError } = await supabase
      .from("households")
      .insert({
        owner_profile_id: user.profile.id,
        name: `${user.profile.last_name || user.profile.first_name} Household`,
      })
      .select("id")
      .single();
    if (createError || !created) {
      return { ok: false, message: "We couldn't create your household. Try again." };
    }
    householdId = created.id;
  }

  const d = parsed.data;
  const { error } = await supabase.from("household_members").insert({
    household_id: householdId,
    first_name: d.first_name,
    last_name: d.last_name,
    date_of_birth: d.date_of_birth || null,
    relationship: d.relationship,
    guardian_profile_id: d.relationship === "child" ? user.profile.id : null,
    emergency_contact_name: d.emergency_contact_name || null,
    emergency_contact_phone: d.emergency_contact_phone || null,
    notes: d.notes || null,
  });

  if (error) {
    console.error("household member insert failed:", error.message);
    return { ok: false, message: "We couldn't add that member. Please try again." };
  }

  revalidatePath("/account/household");
  return { ok: true, message: "Household member added." };
}

export async function removeHouseholdMember(memberId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NOT_CONFIGURED;

  // RLS limits deletes to members of the caller's own household.
  const { error } = await supabase.from("household_members").delete().eq("id", memberId);
  if (error) {
    return { ok: false, message: "We couldn't remove that member." };
  }
  revalidatePath("/account/household");
  return { ok: true, message: "Member removed." };
}

export async function markNotificationsRead(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NOT_CONFIGURED;

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("profile_id", user.profile.id)
    .is("read_at", null);

  revalidatePath("/account/notifications");
  return { ok: true, message: "Marked read." };
}
