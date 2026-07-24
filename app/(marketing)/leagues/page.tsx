import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { getLeagues } from "@/features/content/queries";
import { SectionHeading } from "@/components/marketing/section-heading";
import { LeagueCard } from "@/components/marketing/program-card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = buildMetadata({
  title: "Golf Leagues — Men's, Ladies', Couples, Senior & Team Leagues",
  description:
    "Join a golf league at The Bunker in Linton, Indiana — men's, ladies', couples, senior, business and church team leagues for every skill level.",
  path: "/leagues",
});

export default async function LeaguesPage() {
  const leagues = await getLeagues();
  const regular = leagues.filter((l) => l.category !== "tournament");
  const tournaments = leagues.filter((l) => l.category === "tournament");

  return (
    <>
      <section className="container py-14 md:py-20">
        <SectionHeading
          eyebrow="Leagues & programs"
          title="Find Your League"
          description="Competitive or casual, solo or with a team — there's a league night for you. All leagues include weekly simulator time, standings and a good excuse to get out of the house."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {regular.map((league) => (
            <LeagueCard key={league.id} league={league} />
          ))}
        </div>

        {tournaments.length > 0 ? (
          <>
            <div className="mt-16">
              <SectionHeading eyebrow="One-day events" title="Tournaments" />
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {tournaments.map((league) => (
                <LeagueCard key={league.id} league={league} />
              ))}
            </div>
          </>
        ) : null}

        <div className="mx-auto mt-16 max-w-2xl rounded-lg border border-border/40 bg-surface p-8 text-center">
          <h2 className="font-serif text-2xl font-semibold text-primary">
            Don&apos;t see your league yet?
          </h2>
          <p className="mt-3 leading-relaxed text-charcoal-muted">
            Tell us which leagues you&apos;d like to play in and we&apos;ll help you
            find a spot or get a new group started.
          </p>
          <div className="mt-6">
            <Button asChild size="lg">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
