import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";
import { buildMetadata, localBusinessJsonLd } from "@/lib/seo/metadata";
import { getMenu } from "@/features/content/queries";
import {
  loadFacilityHours,
  loadBayFromHourlyCents,
} from "@/lib/content/facility-info";
import { HeroSection } from "@/components/home/hero";
import { ValuePillars } from "@/components/home/value-pillars";
import { FacilityOverview } from "@/components/home/facility-overview";
import { FoodDrinksSection } from "@/components/home/premium-sections";
import { VisitAndBook } from "@/components/home/visit-and-book";

export const metadata: Metadata = buildMetadata({
  title: "Indoor Golf in Linton, Indiana",
  description:
    "The Bunker is Linton, Indiana's home for premium golf simulators, lessons, leagues, food and drinks — year-round. Book a bay today.",
  path: "/",
});

export default async function HomePage() {
  const [settings, menu, hours, fromHourlyCents] = await Promise.all([
    getSiteSettings(),
    getMenu(),
    loadFacilityHours(),
    loadBayFromHourlyCents(),
  ]);

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

  const directionsQuery = settings.facility.address_line1
    ? `${settings.facility.name} ${settings.facility.address_line1} ${settings.facility.city} ${settings.facility.state}`
    : `${settings.facility.name} ${settings.facility.city} ${settings.facility.state}`;
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    directionsQuery,
  )}`;

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
        eyebrow={settings.hero.eyebrow}
        headline={settings.hero.headline}
        subheadline={settings.hero.subheadline}
      />
      <ValuePillars />
      <FacilityOverview settings={settings} />
      <FoodDrinksSection featuredFood={featuredFood} featuredDrink={featuredDrink} />
      <VisitAndBook
        facility={settings.facility}
        fromHourlyCents={fromHourlyCents}
        hours={hours}
        directionsUrl={directionsUrl}
      />
    </>
  );
}
