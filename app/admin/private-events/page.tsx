import type { Metadata } from "next";
import { getInquiries } from "@/features/admin/queries";
import { AdminPageHeader } from "@/components/admin/ui";
import { InquiryStatusSelect } from "@/components/admin/inquiry-status-select";
import { formatFacility } from "@/lib/dates";

export const metadata: Metadata = { title: "Private Events" };

export default async function AdminPrivateEventsPage() {
  const inquiries = await getInquiries();
  const active = inquiries.filter((i) => !["completed", "lost"].includes(i.status));
  const closed = inquiries.filter((i) => ["completed", "lost"].includes(i.status));

  return (
    <div>
      <AdminPageHeader
        title="Private Event Inquiries"
        description="Work each inquiry through the pipeline: new → contacted → qualified → proposal → hold → confirmed."
      />

      {inquiries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-surface p-8 text-center text-sm text-muted-foreground">
          No inquiries yet. Website inquiries land here the moment they&apos;re
          submitted.
        </p>
      ) : (
        <>
          <div className="space-y-4">
            {active.map((inq) => (
              <div
                key={inq.id}
                className="rounded-lg border border-border/40 bg-surface p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-charcoal">
                      {inq.contact_name}
                      {inq.organization ? ` — ${inq.organization}` : ""}
                    </p>
                    <p className="text-sm text-charcoal-muted">
                      {inq.event_type}
                      {inq.guest_count ? ` · ~${inq.guest_count} guests` : ""}
                      {inq.preferred_date ? ` · ${inq.preferred_date}` : ""}
                      {inq.budget_range ? ` · budget ${inq.budget_range}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <a href={`mailto:${inq.email}`} className="text-primary underline underline-offset-2">
                        {inq.email}
                      </a>
                      {inq.phone ? ` · ${inq.phone}` : ""} · received{" "}
                      {formatFacility(inq.created_at, "MMM d")}
                    </p>
                  </div>
                  <InquiryStatusSelect inquiryId={inq.id} current={inq.status} />
                </div>
                {inq.notes ? (
                  <p className="mt-3 rounded-md bg-surface-muted/70 p-3 text-sm text-charcoal-muted">
                    “{inq.notes}”
                  </p>
                ) : null}
                {inq.accessibility_needs ? (
                  <p className="mt-2 text-sm text-thistle">
                    Accessibility: {inq.accessibility_needs}
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          {closed.length > 0 ? (
            <details className="mt-8">
              <summary className="cursor-pointer font-serif text-lg font-semibold text-primary">
                Completed &amp; lost ({closed.length})
              </summary>
              <div className="mt-3 space-y-3 opacity-70">
                {closed.map((inq) => (
                  <div
                    key={inq.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/40 bg-surface p-4"
                  >
                    <p className="text-sm">
                      <span className="font-medium text-charcoal">
                        {inq.contact_name}
                      </span>{" "}
                      · {inq.event_type}
                    </p>
                    <InquiryStatusSelect inquiryId={inq.id} current={inq.status} />
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
