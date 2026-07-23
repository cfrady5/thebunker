import type { Metadata } from "next";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const SITE_NAME = "The Bunker Indoor Golf";

/** Builds consistent per-page metadata with Open Graph + canonical. */
export function buildMetadata(params: {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
}): Metadata {
  const { title, description, path, noIndex } = params;
  const url = `${SITE_URL}${path}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/** LocalBusiness / SportsActivityLocation structured data. */
export function localBusinessJsonLd(params: {
  phone: string | null;
  address_line1: string | null;
  postal_code: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": ["SportsActivityLocation", "LocalBusiness"],
    name: SITE_NAME,
    description:
      "Indoor golf simulators, lessons, leagues, youth programs and community events in Linton, Indiana.",
    url: SITE_URL,
    image: `${SITE_URL}/brand/logo-full.svg`,
    telephone: params.phone ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: params.address_line1 ?? undefined,
      addressLocality: "Linton",
      addressRegion: "IN",
      postalCode: params.postal_code ?? undefined,
      addressCountry: "US",
    },
    sport: "Golf",
  };
}

export function eventJsonLd(params: {
  name: string;
  description: string;
  startDate: string;
  endDate?: string | null;
  slug: string;
  free: boolean;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: params.name,
    description: params.description,
    startDate: params.startDate,
    endDate: params.endDate ?? undefined,
    url: `${SITE_URL}/events/${params.slug}`,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: SITE_NAME,
      address: { "@type": "PostalAddress", addressLocality: "Linton", addressRegion: "IN" },
    },
    isAccessibleForFree: params.free,
  };
}

export function faqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
