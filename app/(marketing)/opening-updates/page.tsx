import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { getOpeningUpdates } from "@/features/content/queries";
import { SectionHeading } from "@/components/marketing/section-heading";
import { NewsletterForm } from "@/components/marketing/newsletter-form";
import { EmptyState } from "@/components/feedback/empty-state";
import { formatFacility } from "@/lib/dates";

export const metadata: Metadata = buildMetadata({
  title: "Opening Updates — Follow the Build",
  description:
    "Construction progress, league announcements and opening news for The Bunker Indoor Golf in Linton, Indiana. Opening Fall 2026.",
  path: "/opening-updates",
});

export default async function OpeningUpdatesPage() {
  const updates = await getOpeningUpdates();

  return (
    <section className="container py-14 md:py-20">
      <SectionHeading
        eyebrow="The road to opening"
        title="Opening Updates"
        description="Construction milestones, program announcements and everything on the way to opening day."
      />

      <div className="mx-auto mt-12 grid max-w-5xl gap-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {updates.length === 0 ? (
            <EmptyState
              icon={Newspaper}
              title="No updates published yet"
              description="Join the opening list below and updates will come to you."
            />
          ) : (
            updates.map((update) => (
              <article
                key={update.id}
                className="rounded-lg border border-border/40 bg-surface p-7"
              >
                {update.published_at ? (
                  <time
                    dateTime={update.published_at}
                    className="text-xs font-semibold uppercase tracking-widest text-gold-dark"
                  >
                    {formatFacility(update.published_at, "MMMM d, yyyy")}
                  </time>
                ) : null}
                <h2 className="mt-2 font-serif text-2xl font-semibold text-primary">
                  {update.title}
                </h2>
                <div className="mt-4 space-y-3 leading-relaxed text-charcoal-muted">
                  {update.content.split("\n\n").map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-border/40 bg-surface p-6">
            <h2 className="font-serif text-xl font-semibold text-primary">
              Get updates by email
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-charcoal-muted">
              Be first to hear when reservations, leagues and memberships open.
            </p>
            <div className="mt-5">
              <NewsletterForm compact dark={false} />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
