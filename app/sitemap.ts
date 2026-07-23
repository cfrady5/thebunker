import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/metadata";
import {
  getLeagues,
  getOpeningUpdates,
  getPublishedEvents,
} from "@/features/content/queries";

const staticPaths = [
  "",
  "/simulators",
  "/pricing",
  "/memberships",
  "/lessons",
  "/youth-programs",
  "/leagues",
  "/tournaments",
  "/events",
  "/highland-stage",
  "/menu",
  "/private-events",
  "/gift-cards",
  "/about",
  "/opening-updates",
  "/faq",
  "/contact",
  "/policies",
  "/policies/cancellation",
  "/policies/waiver",
  "/policies/privacy",
  "/policies/terms",
  "/accessibility",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [leagues, events] = await Promise.all([
    getLeagues(),
    getPublishedEvents(),
    getOpeningUpdates(),
  ]);

  return [
    ...staticPaths.map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
    })),
    ...leagues.map((l) => ({
      url: `${SITE_URL}/leagues/${l.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...events.map((e) => ({
      url: `${SITE_URL}/events/${e.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
