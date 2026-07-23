import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { getCurrentUser } from "@/lib/permissions";
import { getProgramRegistrations } from "@/features/account/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";
import { formatDateTime } from "@/lib/dates";

export const metadata: Metadata = { title: "Lessons & Programs" };

export default async function AccountProgramsPage() {
  const user = (await getCurrentUser())!;
  const registrations = await getProgramRegistrations(user.profile.id);

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-display-sm font-semibold text-primary">
        Lessons &amp; Programs
      </h1>
      <p className="mt-1 text-sm text-charcoal-muted">
        Your registrations, including any you&apos;ve made for household members.
      </p>

      <div className="mt-8">
        {registrations.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No program registrations yet"
            description="Lessons, clinics and youth programs you register for will appear here."
            action={
              <Button asChild>
                <Link href="/lessons">Browse Lessons</Link>
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {registrations.map((reg) => (
              <li
                key={reg.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border/40 bg-surface p-5"
              >
                <div>
                  <p className="font-medium text-charcoal">
                    {reg.program?.name ?? "Program"}
                    {reg.household_member
                      ? ` — ${reg.household_member.first_name} ${reg.household_member.last_name}`
                      : ""}
                  </p>
                  <p className="text-sm text-charcoal-muted">
                    Registered {formatDateTime(reg.created_at)}
                  </p>
                </div>
                <Badge
                  variant={
                    reg.status === "confirmed"
                      ? "success"
                      : reg.status === "waitlisted"
                        ? "warning"
                        : "outline"
                  }
                >
                  {reg.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
