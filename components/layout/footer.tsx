import Link from "next/link";
import { Facebook, Instagram, Mail } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { loadFacilityHours } from "@/lib/content/facility-info";
import { BrandWordmark } from "@/components/brand/wordmark";
import { homeCopy } from "@/lib/content/home";

const menuLinks = [
  { href: "/book", label: "Reservations" },
  { href: "/menu", label: "Menu" },
  { href: "/leagues", label: "Leagues" },
  { href: "/events", label: "Events" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const infoLinks = [
  { href: "/faq", label: "FAQ" },
  { href: "/policies/privacy", label: "Privacy Policy" },
  { href: "/policies/terms", label: "Terms of Service" },
  { href: "/policies/cancellation", label: "Cancellation Policy" },
  { href: "/policies/waiver", label: "Waiver" },
  { href: "/accessibility", label: "Accessibility" },
];

export async function SiteFooter() {
  const [settings, hours] = await Promise.all([getSiteSettings(), loadFacilityHours()]);
  const year = new Date().getFullYear();

  return (
    <footer className="bg-primary-dark text-cream">
      <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-8 xl:px-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <BrandWordmark width={180} />
            <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-cream/70">
              {homeCopy.footer.statement}
            </p>
            <div className="mt-6 flex gap-3">
              {settings.social.facebook ? (
                <a
                  href={settings.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="The Bunker on Facebook"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 text-cream/80 transition-colors hover:border-gold hover:text-gold"
                >
                  <Facebook aria-hidden className="h-5 w-5" />
                </a>
              ) : null}
              {settings.social.instagram ? (
                <a
                  href={settings.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="The Bunker on Instagram"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 text-cream/80 transition-colors hover:border-gold hover:text-gold"
                >
                  <Instagram aria-hidden className="h-5 w-5" />
                </a>
              ) : null}
              {settings.facility.email ? (
                <a
                  href={`mailto:${settings.facility.email}`}
                  aria-label="Email The Bunker"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 text-cream/80 transition-colors hover:border-gold hover:text-gold"
                >
                  <Mail aria-hidden className="h-5 w-5" />
                </a>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-8 lg:grid-cols-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                Location
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-cream/75">
                {settings.facility.address_line1 ? (
                  <>
                    {settings.facility.address_line1}
                    <br />
                  </>
                ) : null}
                {settings.facility.city}, {settings.facility.state}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                Contact
              </p>
              <ul className="mt-4 space-y-2 text-cream/75">
                <li>
                  {settings.facility.email ? (
                    <a
                      href={`mailto:${settings.facility.email}`}
                      className="text-[14px] leading-snug break-words transition-colors hover:text-cream"
                    >
                      {settings.facility.email}
                    </a>
                  ) : (
                    <span className="text-[15px]">Email coming soon</span>
                  )}
                </li>
                <li className="text-[15px]">
                  {settings.facility.phone ?? "Phone coming soon"}
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                Hours
              </p>
              {hours && hours.week.length > 0 ? (
                <ul className="mt-4 space-y-1.5 text-[15px] text-cream/75">
                  {hours.week.map((h) => (
                    <li key={h.days}>
                      <span className="text-cream/60">{h.days}</span>{" "}
                      <span className="whitespace-nowrap">{h.range}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-[15px] text-cream/75">
                  <Link href="/contact" className="transition-colors hover:text-cream">
                    Hours &amp; directions
                  </Link>
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                Menu
              </p>
              <ul className="mt-4 space-y-2">
                {menuLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[15px] text-cream/75 transition-colors hover:text-cream"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                Info
              </p>
              <ul className="mt-4 space-y-2">
                {infoLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[15px] text-cream/75 transition-colors hover:text-cream"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-cream/10 pt-6 text-sm text-cream/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {settings.facility.name}. All rights reserved.</p>
          <Link
            href="/portal"
            className="font-medium uppercase tracking-[0.14em] text-cream/50 transition-colors hover:text-gold"
          >
            Employee Portal
          </Link>
        </div>
      </div>
    </footer>
  );
}
