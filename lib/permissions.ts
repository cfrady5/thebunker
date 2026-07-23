import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile, StaffRole } from "@/types";

export interface CurrentUser {
  authUserId: string;
  profile: Profile;
  roles: StaffRole[];
}

/**
 * Loads the signed-in user's profile and staff roles. Returns null
 * when signed out or Supabase is not configured. Role data comes
 * from the database on every request — never from client input.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();
  if (!profile) return null;

  const { data: roleRows } = await supabase
    .from("staff_roles")
    .select("role")
    .eq("profile_id", (profile as Profile).id)
    .eq("active", true);

  return {
    authUserId: user.id,
    profile: profile as Profile,
    roles: (roleRows ?? []).map((r) => r.role as StaffRole),
  };
});

export function hasRole(user: CurrentUser | null, roles: StaffRole[]): boolean {
  if (!user) return false;
  return user.roles.some((r) => roles.includes(r));
}

export function isStaff(user: CurrentUser | null): boolean {
  return (user?.roles.length ?? 0) > 0;
}

export function isAdmin(user: CurrentUser | null): boolean {
  return hasRole(user, ["owner", "manager"]);
}

/** Throws when the caller lacks one of the given roles. */
export async function requireRole(roles: StaffRole[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || !hasRole(user, roles)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
