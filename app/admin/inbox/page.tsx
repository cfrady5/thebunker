import type { Metadata } from "next";
import { getContactMessages } from "@/features/admin/queries";
import { AdminPageHeader } from "@/components/admin/ui";
import { ContactMessageStatusSelect } from "@/components/admin/contact-message-status-select";
import { formatFacility } from "@/lib/dates";

export const metadata: Metadata = { title: "Inbox" };

export default async function AdminInboxPage() {
  const messages = await getContactMessages();
  const open = messages.filter((m) => m.status !== "archived");
  const archived = messages.filter((m) => m.status === "archived");
  const newCount = messages.filter((m) => m.status === "new").length;

  return (
    <div>
      <AdminPageHeader
        title="Inbox"
        description="Messages sent through the website contact form. New messages are highlighted until you mark them read."
      />

      {messages.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-surface p-8 text-center text-sm text-muted-foreground">
          No messages yet. Contact-form submissions land here the moment
          they&apos;re sent.
        </p>
      ) : (
        <>
          {newCount > 0 ? (
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-gold/15 px-3 py-1 text-sm font-semibold text-gold-dark">
              {newCount} new {newCount === 1 ? "message" : "messages"}
            </p>
          ) : null}

          <div className="space-y-4">
            {open.map((m) => (
              <div
                key={m.id}
                className={
                  m.status === "new"
                    ? "rounded-lg border border-gold/40 bg-gold/[0.04] p-5"
                    : "rounded-lg border border-border/40 bg-surface p-5"
                }
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-charcoal">{m.subject}</p>
                    <p className="mt-0.5 text-sm text-charcoal-muted">
                      {m.name} ·{" "}
                      <a
                        href={`mailto:${m.email}?subject=${encodeURIComponent(
                          `Re: ${m.subject}`,
                        )}`}
                        className="text-primary underline underline-offset-2"
                      >
                        {m.email}
                      </a>{" "}
                      · {formatFacility(m.created_at, "MMM d, h:mm a")}
                    </p>
                  </div>
                  <ContactMessageStatusSelect id={m.id} current={m.status} />
                </div>
                <p className="mt-3 whitespace-pre-line rounded-md bg-surface-muted/70 p-3 text-sm leading-relaxed text-charcoal-muted">
                  {m.message}
                </p>
                <a
                  href={`mailto:${m.email}?subject=${encodeURIComponent(
                    `Re: ${m.subject}`,
                  )}`}
                  className="mt-3 inline-block text-sm font-semibold text-primary underline underline-offset-2"
                >
                  Reply by email
                </a>
              </div>
            ))}
          </div>

          {archived.length > 0 ? (
            <details className="mt-8">
              <summary className="cursor-pointer font-serif text-lg font-semibold text-primary">
                Archived ({archived.length})
              </summary>
              <div className="mt-3 space-y-3 opacity-70">
                {archived.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/40 bg-surface p-4"
                  >
                    <p className="min-w-0 text-sm">
                      <span className="font-medium text-charcoal">{m.subject}</span>{" "}
                      · {m.name}
                    </p>
                    <ContactMessageStatusSelect id={m.id} current={m.status} />
                  </div>
                ))}
              </div>
            </details>
          ) : null}
        </>
      )}
    </div>
  );
}
