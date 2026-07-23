import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSiteSettings } from "@/lib/settings";
import { SectionHeading } from "@/components/marketing/section-heading";
import { TartanDivider } from "@/components/brand/tartan-divider";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = buildMetadata({
  title: "About The Bunker — Jay & Amanda's Indoor Golf Clubhouse",
  description:
    "The story behind The Bunker Indoor Golf: founders Jay and Amanda are building a year-round home for golf and community in Linton, Indiana.",
  path: "/about",
});

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <section className="container grid items-center gap-10 py-14 md:py-20 lg:grid-cols-2">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Our story"
            title="Built by Neighbors, for Neighbors"
          />
          <div className="mt-6 space-y-4 leading-relaxed text-charcoal-muted">
            <p>
              The Bunker started with a simple frustration: in Greene County, golf
              season ends when the frost arrives — and for a lot of people it never
              really begins. Courses can feel intimidating if you didn&apos;t grow
              up playing. Lessons are a drive away. Winter is long.
            </p>
            <p>
              Founders <strong className="text-charcoal">Jay and Amanda</strong>{" "}
              wanted a place where all of that changes. Where a scratch golfer can
              sharpen their game in January, a couple can try golf for the first
              time on a Friday night, kids can fall in love with the sport after
              school, and the community has one more warm, welcoming place to
              gather.
            </p>
            <p>
              That place is The Bunker: state-of-the-art simulator bays, a putting
              green, real instruction, leagues for every kind of player, and a
              lounge where you&apos;ll want to stay after your round — opening in
              Linton in {settings.opening_label}.
            </p>
          </div>
        </div>
        <div className="flex justify-center">
          <Logo variant="full" width={260} height={303} />
        </div>
      </section>

      <TartanDivider />

      <section className="bg-surface py-14 md:py-20">
        <div className="container">
          <SectionHeading
            eyebrow="What we believe"
            title="A Year-Round Place to Play, Learn, Compete and Connect"
          />
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2">
            {[
              {
                title: "Golf for everyone",
                body: "No dress codes, no gatekeeping. If you're curious about golf, you belong here — we'll meet you wherever your game is.",
              },
              {
                title: "Local first",
                body: "Local drafts at the bar, local musicians on the stage, local causes on the calendar. The Bunker succeeds when Linton does.",
              },
              {
                title: "Quality without pretense",
                body: "Professional-grade simulators and instruction in an atmosphere that feels like a friend's (very well-equipped) basement.",
              },
              {
                title: "Family friendly",
                body: "Youth programs, kids' menu items and daytime hours that work for parents, grandparents and juniors alike.",
              },
            ].map((value) => (
              <div key={value.title} className="rounded-lg border border-border/40 bg-background p-6">
                <h3 className="font-serif text-xl font-semibold text-primary">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal-muted">
                  {value.body}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/#opening-list">Follow the Journey</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/simulators">See the Simulator Experience</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
