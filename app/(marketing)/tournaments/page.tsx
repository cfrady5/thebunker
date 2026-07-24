import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { getLeagues } from "@/features/content/queries";
import { SectionHeading } from "@/components/marketing/section-heading";
import { LeagueCard } from "@/components/marketing/program-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";

export const metadata: Metadata = buildMetadata({
  title: "Tournaments — Indoor Golf Competitions in Linton, Indiana",
  description:
    "Scrambles, skins games and championship events at The Bunker Indoor Golf. See upcoming tournaments and register your team.",
  path: "/tournaments",
});

export default async function TournamentsPage() {
  const leagues = await getLeagues();
  const tournaments = leagues.filter((l) => l.category === "tournament");

  return (
    <section className="container py-14 md:py-20">
      <SectionHeading
        eyebrow="Compete"
        title="Tournaments"
        description="One-day events with formats for every skill level — scrambles, skins and season championships, with prizes worth showing up for."
      />
      <div className="mt-12">
        {tournaments.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((t) => (
              <LeagueCard key={t.id} league={t} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Trophy}
            title="No tournaments scheduled yet"
            description="New tournaments post here as they're scheduled — explore our leagues or book a bay in the meantime."
            action={
              <Button asChild>
                <Link href="/leagues">Explore Leagues</Link>
              </Button>
            }
          />
        )}
      </div>
    </section>
  );
}
