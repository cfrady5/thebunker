import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { getMenu } from "@/features/content/queries";
import { getSiteSettings } from "@/lib/settings";
import { SectionHeading } from "@/components/marketing/section-heading";
import { MenuBrowser } from "@/components/marketing/menu-browser";
import { InlineAlert } from "@/components/feedback/inline-alert";

export const metadata: Metadata = buildMetadata({
  title: "Food & Drink Menu",
  description:
    "Shareables, sandwiches, kids' items, desserts, local drafts and more at The Bunker Indoor Golf in Linton, Indiana.",
  path: "/menu",
});

export default async function MenuPage() {
  const [menu, settings] = await Promise.all([getMenu(), getSiteSettings()]);

  return (
    <section className="container py-14 md:py-20">
      <SectionHeading
        eyebrow="Food & drinks"
        title="Food, Drinks and a Place to Settle In"
        description="Light bites, cold drinks and an easy place to unwind between rounds. Everything is made to be shared across the bay."
      />

      {settings.business_mode === "pre_opening" ? (
        <div className="mx-auto mt-8 max-w-2xl">
          <InlineAlert variant="info" title="Preview menu">
            This is our planned opening menu — items and prices may change before we
            open in {settings.opening_label}.
          </InlineAlert>
        </div>
      ) : null}

      <div className="mt-10">
        <MenuBrowser categories={menu.categories} items={menu.items} />
      </div>

      <p className="mx-auto mt-12 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground">
        Dietary labels are provided as a courtesy and our kitchen handles common
        allergens. If you have a food allergy or specific dietary need, please talk
        with our staff before ordering — we&apos;re glad to help you choose safely.
      </p>
    </section>
  );
}
