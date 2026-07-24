import type { Metadata } from "next";
import { getSiteSettings, bookingIsOpen } from "@/lib/settings";
import { buildMetadata, localBusinessJsonLd } from "@/lib/seo/metadata";
import { homeCopy, galleryImages } from "@/lib/content/home";
import { getMenu } from "@/features/content/queries";
import { HeroSection } from "@/components/home/hero";
import { ValuePillars } from "@/components/home/value-pillars";
import { CommunityGallery } from "@/components/home/community-gallery";
import { OpeningSignupSection } from "@/components/home/opening-signup-section";
import {
  FoodDrinksSection,
  TestimonialsSection,
} from "@/components/home/premium-sections";

export const metadata: Metadata = buildMetadata({
  title: "Indoor Golf in Linton, Indiana — Opening Fall 2026",
  description:
    "The Bunker brings state-of-the-art golf simulators, leagues, lessons, good food and community together in Linton, Indiana. Opening Fall 2026 — join the list.",
  path: "/",
});

export default async function HomePage() {
  const [settings, menu] = await Promise.all([getSiteSettings(), getMenu()]);
  const canBook = bookingIsOpen(settings.business_mode);

  const featuredMenu = menu.items.filter((i) => i.featured && i.available);
  const drinkCategoryIds = new Set(
    menu.categories
      .filter((c) => ["drinks", "beer-wine", "cocktails"].includes(c.slug))
      .map((c) => c.id),
  );
  const featuredFood =
    featuredMenu.find((i) => !drinkCategoryIds.has(i.category_id)) ??
    menu.items.find((i) => !drinkCategoryIds.has(i.category_id)) ??
    null;
  const featuredDrink =
    featuredMenu.find((i) => drinkCategoryIds.has(i.category_id)) ??
    menu.items.find((i) => drinkCategoryIds.has(i.category_id)) ??
    null;

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
      <FoodDrinksSection featuredFood={featuredFood} featuredDrink={featuredDrink} />
      <TestimonialsSection />
      <CommunityGallery
        images={[...galleryImages]}
        eyebrow={homeCopy.gallery.eyebrow}
        heading={homeCopy.gallery.heading}
      />
      <OpeningSignupSection />
    </>
  );
}
