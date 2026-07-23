"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { BrandWordmark, WordmarkLink } from "@/components/brand/wordmark";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/book", label: "Reservations" },
  { href: "/menu", label: "Menu" },
  { href: "/leagues", label: "Leagues" },
  { href: "/about", label: "About" },
];

export function HeaderShell({
  canBook,
  signedIn,
  staff,
}: {
  canBook: boolean;
  signedIn: boolean;
  staff: boolean;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const accountHref = staff ? "/admin" : signedIn ? "/account" : "/login";
  const accountLabel = staff ? "Staff" : signedIn ? "My Account" : "Sign In";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-primary-dark text-cream transition-shadow duration-200",
        scrolled && "shadow-[0_2px_16px_rgb(5_36_25/0.35)]",
      )}
    >
      <div className="mx-auto flex h-[76px] max-w-[1400px] items-center justify-between px-5 md:h-[96px] md:px-8 xl:px-16">
        <WordmarkLink width={150} className="md:hidden" />
        <WordmarkLink width={185} className="hidden md:inline-flex" />

        <nav aria-label="Main navigation" className="hidden items-center gap-9 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative text-[13px] font-semibold uppercase tracking-[0.14em] transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-px after:bg-gold after:transition-all after:duration-200",
                  active
                    ? "text-cream after:w-full"
                    : "text-cream/75 after:w-0 hover:text-cream hover:after:w-full",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={accountHref}
            className="hidden items-center rounded-md border border-gold/70 px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.14em] text-gold transition-colors hover:border-gold hover:bg-gold/10 hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold lg:inline-flex"
          >
            {accountLabel}
          </Link>
          <button
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-cream transition-colors hover:bg-cream/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold lg:hidden"
          >
            {menuOpen ? (
              <X aria-hidden className="h-6 w-6" />
            ) : (
              <Menu aria-hidden className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu — full-height dark panel */}
      {menuOpen ? (
        <div className="fixed inset-0 top-[76px] z-40 flex flex-col bg-primary-dark lg:hidden">
          <nav
            aria-label="Mobile navigation"
            className="flex flex-1 flex-col gap-1 overflow-y-auto px-6 pt-6"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-4 font-serif text-2xl text-cream transition-colors hover:bg-cream/5"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={accountHref}
              className="rounded-md px-3 py-4 font-serif text-2xl text-cream transition-colors hover:bg-cream/5"
            >
              {accountLabel}
            </Link>
          </nav>
          <div className="border-t border-cream/10 px-6 py-6">
            <Link
              href={canBook ? "/book" : "/#opening-list"}
              className="flex h-12 w-full items-center justify-center rounded-md bg-gold text-sm font-semibold uppercase tracking-wider text-primary-dark transition-colors hover:bg-gold-dark hover:text-cream"
            >
              {canBook ? "Book a Bay" : "Join the Opening List"}
            </Link>
            <div className="mt-5 flex justify-center opacity-60">
              <BrandWordmark width={110} />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
