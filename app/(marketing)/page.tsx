import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";
import { buildMetadata, localBusinessJsonLd } from "@/lib/seo/metadata";
import { getMenu } from "@/features/content/queries";
import { HeroSection } from "@/components/home/hero";
import { ValuePillars } from "@/components/home/value-pillars";
import { FacilityOverview } from "@/components/home/facility-overview";
import { FoodDrinksSection } from "@/components/home/premium-sections";

export const metadata: Metadata = buildMetadata({
  title: "Indoor Golf in Linton, Indiana",
  description:
    "The Bunker is Linton, Indiana's home for premium golf simulators, lessons, leagues, food and drinks — year-round. Book a bay today.",
  path: "/",
});

export default async function HomePage() {
  const [settings, menu] = await Promise.all([getSiteSettings(), getMenu()]);

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
        eyebrow={settings.hero.eyebrow}
        headline={settings.hero.headline}
        subheadline={settings.hero.subheadline}
      />
      <ValuePillars />
      <FacilityOverview settings={settings} />
      <FoodDrinksSection featuredFood={featuredFood} featuredDrink={featuredDrink} />
    </>
  );
}
