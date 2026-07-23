import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { getCurrentUser } from "@/lib/permissions";
import { getNotifications } from "@/features/account/queries";
import { markNotificationsRead } from "@/features/account/actions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";
import { formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };

export default async function AccountNotificationsPage() {
  const user = (await getCurrentUser())!;
  const notifications = await getNotifications(user.profile.id);
  const hasUnread = notifications.some((n) => !n.read_at);

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-display-sm font-semibold text-primary">
          Notifications
        </h1>
        {hasUnread ? (
          <form
            action={async () => {
              "use server";
              await markNotificationsRead();
            }}
          >
            <Button type="submit" variant="outline" size="sm">
              Mark all read
            </Button>
          </form>
        ) : null}
      </div>

      <div className="mt-8">
        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="You're all caught up"
            description="Reservation updates, league news and membership notices will appear here."
          />
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={cn(
                  "rounded-lg border p-4",
                  n.read_at
                    ? "border-border/40 bg-surface"
                    : "border-gold/40 bg-gold/5",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-charcoal">{n.title}</p>
                  <time className="shrink-0 text-xs text-muted-foreground">
                    {formatDateTime(n.created_at)}
                  </time>
                </div>
                {n.body ? (
                  <p className="mt-1 text-sm text-charcoal-muted">{n.body}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
