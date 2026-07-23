import Link from "next/link";
import { getSiteSettings } from "@/lib/settings";
import { Logo } from "@/components/brand/logo";
import { TartanDivider } from "@/components/brand/tartan-divider";
import { NewsletterForm } from "@/components/marketing/newsletter-form";

const footerNav = [
  {
    heading: "Golf",
    links: [
      { href: "/simulators", label: "Simulator Experience" },
      { href: "/pricing", label: "Pricing" },
      { href: "/lessons", label: "Lessons" },
      { href: "/memberships", label: "Memberships" },
      { href: "/leagues", label: "Leagues" },
    ],
  },
  {
    heading: "Visit",
    links: [
      { href: "/events", label: "Events" },
      { href: "/highland-stage", label: "Highland Stage" },
      { href: "/menu", label: "Food & Drinks" },
      { href: "/private-events", label: "Private Events" },
      { href: "/gift-cards", label: "Gift Cards" },
    ],
  },
  {
    heading: "The Bunker",
    links: [
      { href: "/about", label: "About" },
      { href: "/opening-updates", label: "Opening Updates" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
      { href: "/accessibility", label: "Accessibility" },
    ],
  },
];

export async function SiteFooter() {
  const settings = await getSiteSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-primary-dark text-cream">
      <TartanDivider />
      <div className="container grid gap-10 py-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <Logo variant="cream" width={90} height={105} />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/80">
            A year-round place to play, learn, compete and connect — indoor golf,
            lessons, leagues and community events in Linton, Indiana.
          </p>
          <p className="mt-4 text-sm font-semibold text-gold">
            Coming {settings.opening_label}
          </p>
        </div>

        {footerNav.map((col) => (
          <nav key={col.heading} aria-label={col.heading} className="lg:col-span-2">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gold">
              {col.heading}
            </p>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream/80 transition-colors hover:text-cream"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="lg:col-span-2">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gold">
            Stay in the loop
          </p>
          <NewsletterForm compact />
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="container flex flex-col items-start justify-between gap-3 py-6 text-xs text-cream/60 sm:flex-row sm:items-center">
          <p>
            © {year} {settings.facility.name}. All rights reserved. ·{" "}
            {settings.facility.city}, {settings.facility.state}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/policies/privacy" className="hover:text-cream">
              Privacy
            </Link>
            <Link href="/policies/terms" className="hover:text-cream">
              Terms
            </Link>
            <Link href="/policies/cancellation" className="hover:text-cream">
              Cancellation Policy
            </Link>
            <Link href="/policies/waiver" className="hover:text-cream">
              Waiver
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
