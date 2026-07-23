import type { Metadata } from "next";
import { getSiteSettings, bookingIsOpen } from "@/lib/settings";
import { buildMetadata, localBusinessJsonLd } from "@/lib/seo/metadata";
import { homeCopy, galleryImages } from "@/lib/content/home";
import { HeroSection } from "@/components/home/hero";
import { ValuePillars } from "@/components/home/value-pillars";
import { CommunityGallery } from "@/components/home/community-gallery";
import { OpeningSignupSection } from "@/components/home/opening-signup-section";

export const metadata: Metadata = buildMetadata({
  title: "Indoor Golf in Linton, Indiana — Opening Fall 2026",
  description:
    "The Bunker brings state-of-the-art golf simulators, leagues, lessons, good food and community together in Linton, Indiana. Opening Fall 2026 — join the list.",
  path: "/",
});

export default async function HomePage() {
  const settings = await getSiteSettings();
  const canBook = bookingIsOpen(settings.business_mode);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            localBusinessJsonLd({
              phone: settings.facility.phone,
              address_line1: settings.facility.address_line1,
              postal_code: settings.facility.postal_code,
            }),
          ),
        }}
      />
      <HeroSection
        canBook={canBook}
        eyebrow={settings.hero.eyebrow}
        headline={settings.hero.headline}
        paragraph={settings.hero.subheadline}
      />
      <ValuePillars />
      <CommunityGallery
        images={[...galleryImages]}
        eyebrow={homeCopy.gallery.eyebrow}
        heading={homeCopy.gallery.heading}
      />
      <OpeningSignupSection />
    </>
  );
}
