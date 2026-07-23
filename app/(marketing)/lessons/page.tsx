import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPrograms } from "@/features/content/queries";
import { SectionHeading } from "@/components/marketing/section-heading";
import { statusBadge } from "@/components/marketing/program-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCents, formatDuration } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Golf Lessons — Private Instruction & Clinics in Linton, Indiana",
  description:
    "Private golf lessons, swing evaluations, beginner classes and group clinics at The Bunker in Linton, Indiana — powered by simulator ball-flight data.",
  path: "/lessons",
});

const ADULT_CATEGORIES = [
  "private_lesson",
  "beginner_lesson",
  "swing_evaluation",
  "putting",
  "group_lesson",
];

export default async function LessonsPage() {
  const programs = await getPrograms();
  const lessons = programs.filter((p) => ADULT_CATEGORIES.includes(p.category));

  return (
    <>
      <section className="bg-primary-dark py-16 text-cream md:py-20">
        <div className="container max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gold">
            Lessons &amp; instruction
          </p>
          <h1 className="text-display-lg font-semibold">Get Better, Faster</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-cream/85">
            Every lesson is backed by real swing data from the simulator — no
            guessing, just clear feedback and a plan. From your very first swing
            to shaving strokes off a single-digit handicap.
          </p>
        </div>
      </section>

      <section className="container py-14 md:py-20">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {lessons.map((program) => (
            <Card key={program.id} id={program.slug} className="flex flex-col scroll-mt-24">
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
                <dl className="mt-4 space-y-1 text-sm text-charcoal-muted">
                  {program.duration_minutes ? (
                    <div>
                      <dt className="inline font-medium text-charcoal">Length: </dt>
                      <dd className="inline">{formatDuration(program.duration_minutes)}</dd>
                    </div>
                  ) : null}
                  {program.price_cents > 0 ? (
                    <div>
                      <dt className="inline font-medium text-charcoal">Price: </dt>
                      <dd className="inline">{formatCents(program.price_cents)}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="inline font-medium text-charcoal">Bring: </dt>
                    <dd className="inline">
                      {program.what_to_bring ??
                        "Just yourself — clubs are available if you need them"}
                    </dd>
                  </div>
                </dl>
                <div className="mt-5">
                  {program.status === "open" ? (
                    <Button asChild className="w-full">
                      <Link href={`/signup?program=${program.slug}`}>Book This Lesson</Link>
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

        <div className="mx-auto mt-16 max-w-3xl rounded-lg border border-border/40 bg-surface p-8">
          <SectionHeading
            eyebrow="Instructors"
            title="Meet Your Teaching Team"
            description="Our instruction staff will be announced closer to opening. Expect patient, encouraging coaches who teach real fundamentals — and remember what it's like to be new."
          />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Interested in teaching at The Bunker?{" "}
            <Link href="/contact?subject=Instructor inquiry" className="font-medium text-primary underline underline-offset-2">
              We&apos;d love to hear from you
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
