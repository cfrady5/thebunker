import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { getCurrentUser } from "@/lib/permissions";
import { getLeagueRegistrations } from "@/features/account/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";
import { formatDateTime } from "@/lib/dates";

export const metadata: Metadata = { title: "League Registrations" };

export default async function AccountLeaguesPage() {
  const user = (await getCurrentUser())!;
  const registrations = await getLeagueRegistrations(user.profile.id);

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-display-sm font-semibold text-primary">
        League Registrations
      </h1>

      <div className="mt-8">
        {registrations.length === 0 ? (
          <EmptyState
            icon={Users}
            title="League registration has not opened yet."
            description="Browse the leagues we're planning and join the interest list for the ones that fit."
            action={
              <Button asChild>
                <Link href="/leagues">Join the Interest List</Link>
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
                    {reg.league ? (
                      <Link
                        href={`/leagues/${reg.league.slug}`}
                        className="hover:text-primary"
                      >
                        {reg.league.name}
                      </Link>
                    ) : (
                      "League"
                    )}
                  </p>
                  <p className="text-sm text-charcoal-muted">
                    {reg.league?.season} · registered {formatDateTime(reg.created_at)}
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
