import type { Metadata } from "next";
import Link from "next/link";
import { HeartHandshake, ShieldCheck, Smile } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPrograms } from "@/features/content/queries";
import { SectionHeading } from "@/components/marketing/section-heading";
import { statusBadge } from "@/components/marketing/program-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCents, formatDuration } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Youth Golf Programs — Junior Clinics & Junior League",
  description:
    "Youth golf clinics, junior leagues and beginner-friendly instruction for kids at The Bunker in Linton, Indiana. Fun first, fundamentals always.",
  path: "/youth-programs",
});

export default async function YouthProgramsPage() {
  const programs = await getPrograms();
  const youth = programs.filter((p) =>
    ["youth_clinic", "junior_league"].includes(p.category),
  );

  return (
    <>
      <section className="container py-14 md:py-20">
        <SectionHeading
          eyebrow="Youth programs"
          title="Raising the Next Generation of Golfers"
          description="Fun-first clinics and junior leagues that build real skills — no country club stuffiness, no pressure, lots of high fives."
        />

        <div className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-3">
          {[
            {
              icon: Smile,
              title: "Fun first",
              body: "Games and challenges keep kids engaged while fundamentals sneak in.",
            },
            {
              icon: ShieldCheck,
              title: "Safe & supervised",
              body: "Small groups, trained coaches, and a parent-friendly waiver and pickup process.",
            },
            {
              icon: HeartHandshake,
              title: "All abilities",
              body: "First-timers and junior competitors both have a place here.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-border/40 bg-surface p-6 text-center">
              <item.icon aria-hidden className="mx-auto h-7 w-7 text-gold-dark" />
              <h2 className="mt-3 font-serif text-lg font-semibold text-primary">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-charcoal-muted">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {youth.map((program) => (
            <Card key={program.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col p-6">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h2 className="font-serif text-xl font-semibold text-primary">
                    {program.name}
                  </h2>
                  {statusBadge(program.status)}
                </div>
                <p className="flex-1 text-sm leading-relaxed text-charcoal-muted">
                  {program.description}
                </p>
                <p className="mt-4 text-sm text-charcoal-muted">
                  {[
                    program.age_min !== null && program.age_max !== null
                      ? `Ages ${program.age_min}–${program.age_max}`
                      : null,
                    program.duration_minutes
                      ? formatDuration(program.duration_minutes)
                      : null,
                    program.price_cents > 0 ? formatCents(program.price_cents) : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <div className="mt-5">
                  {program.status === "open" ? (
                    <Button asChild className="w-full">
                      <Link href={`/signup?program=${program.slug}`}>
                        Register a Junior Golfer
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/#opening-list">Join the Interest List</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mx-auto mt-14 max-w-3xl rounded-lg border border-gold/30 bg-gold/5 p-8">
          <h2 className="font-serif text-xl font-semibold text-primary">
            For parents &amp; guardians
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-charcoal-muted">
            <li>
              Registration is completed by a parent or guardian through your Bunker
              account, where you can add your kids as household members.
            </li>
            <li>
              We collect emergency contacts, any medical or accessibility notes, and
              a signed participation waiver for every junior participant.
            </li>
            <li>
              Photo consent is optional and always your choice — kids are never
              featured publicly without it.
            </li>
            <li>You&apos;re welcome to stay and watch from the lounge during sessions.</li>
          </ul>
        </div>
      </section>
    </>
  );
}
