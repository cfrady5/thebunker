import type { Metadata } from "next";
import { Users } from "lucide-react";
import { getCurrentUser } from "@/lib/permissions";
import { getHousehold } from "@/features/account/queries";
import { EmptyState } from "@/components/feedback/empty-state";
import {
  AddHouseholdMemberDialog,
  RemoveMemberButton,
} from "@/components/account/household-manager";

export const metadata: Metadata = { title: "Household" };

export default async function AccountHouseholdPage() {
  const user = (await getCurrentUser())!;
  const household = await getHousehold(user.profile.id);

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-display-sm font-semibold text-primary">
            Household
          </h1>
          <p className="mt-1 text-sm text-charcoal-muted">
            Add kids and family members so you can register them for programs and
            keep waivers in one place.
          </p>
        </div>
        <AddHouseholdMemberDialog />
      </div>

      <div className="mt-8">
        {!household || household.members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No household members yet"
            description="Add your kids or family members to register them for youth programs and clinics."
          />
        ) : (
          <ul className="space-y-3">
            {household.members.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-border/40 bg-surface p-5"
              >
                <div>
                  <p className="font-medium text-charcoal">
                    {member.first_name} {member.last_name}
                  </p>
                  <p className="text-sm capitalize text-charcoal-muted">
                    {member.relationship ?? "member"}
                    {member.date_of_birth ? ` · born ${member.date_of_birth}` : ""}
                  </p>
                  {member.emergency_contact_name ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Emergency: {member.emergency_contact_name}
                      {member.emergency_contact_phone
                        ? ` (${member.emergency_contact_phone})`
                        : ""}
                    </p>
                  ) : null}
                </div>
                <RemoveMemberButton
                  memberId={member.id}
                  name={`${member.first_name} ${member.last_name}`}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
