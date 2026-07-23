import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/permissions";
import { ProfileForm } from "@/components/account/profile-form";

export const metadata: Metadata = { title: "Profile" };

export default async function AccountProfilePage() {
  const user = (await getCurrentUser())!;

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-display-sm font-semibold text-primary">Profile</h1>
      <p className="mt-1 text-sm text-charcoal-muted">
        Your details help us set up bays, clubs and lessons before you arrive.
      </p>
      <div className="mt-8">
        <ProfileForm profile={user.profile} />
      </div>
    </div>
  );
}
