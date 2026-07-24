"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, UserRound, X } from "lucide-react";
import { BrandWordmark, WordmarkLink } from "@/components/brand/wordmark";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/leagues", label: "Leagues" },
  { href: "/events", label: "Events" },
  { href: "/menu", label: "Menu" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

/**
 * Premium sticky header. On the homepage it floats transparent over
 * the cinematic hero and gains a glass blur once scrolled; on other
 * pages it stays solid dark green.
 */
export function HeaderShell({
  signedIn,
}: {
  signedIn: boolean;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  // Solid dark-green header on every page — it sits above the green hero
  // on the homepage rather than floating transparently over it.
  const overHero = false;

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    setMounted(true);
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

  const accountHref = signedIn ? "/account" : "/login";
  const accountLabel = signedIn ? "My Account" : "Sign In";

  return (
    <header
      className={cn(
        "top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-300",
        overHero ? "fixed inset-x-0" : "sticky",
        overHero && !scrolled && !menuOpen
          ? "bg-transparent"
          : "bg-primary-dark/85 shadow-[0_2px_24px_rgb(5_36_25/0.45)] backdrop-blur-md supports-[backdrop-filter]:bg-primary-dark/70",
        !overHero && "bg-primary-dark/95 supports-[backdrop-filter]:bg-primary-dark/85",
        menuOpen && "bg-primary-dark",
      )}
    >
      <div className="mx-auto flex h-[76px] max-w-[1400px] items-center justify-between px-5 md:h-[92px] md:px-8 xl:px-16">
        <WordmarkLink width={128} className="md:hidden" />
        <WordmarkLink width={158} className="hidden md:inline-flex" />

        <nav aria-label="Main navigation" className="hidden items-center gap-7 xl:gap-8 lg:flex">
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
                    : "text-cream/80 after:w-0 hover:text-cream hover:after:w-full",
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
            aria-label={accountLabel}
            title={accountLabel}
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-cream/30 text-cream/90 transition-colors hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold lg:inline-flex"
          >
            <UserRound aria-hidden className="h-5 w-5" />
          </Link>
          <Link
            href="/book"
            className="hidden items-center rounded-md bg-gold px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-primary-dark shadow-[0_4px_20px_rgb(201_164_106/0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-dark hover:text-cream hover:shadow-[0_8px_28px_rgb(201_164_106/0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream motion-reduce:hover:translate-y-0 lg:inline-flex"
          >
            Book a Bay
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

      {/*
        Mobile menu is portaled to <body> on purpose: the header carries a
        backdrop-filter, which makes it the containing block for fixed
        descendants — a panel rendered inside it would size against the
        76px header instead of the viewport. The portal keeps `fixed`
        viewport-relative.
      */}
      {mounted && menuOpen
        ? createPortal(
            <div className="fixed inset-x-0 top-[76px] bottom-0 z-50 flex flex-col bg-primary-dark md:top-[92px] lg:hidden">
              <nav
                aria-label="Mobile navigation"
                className="flex flex-1 flex-col gap-1 overflow-y-auto px-6 pt-6"
              >
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-md px-3 py-4 font-serif text-2xl text-cream transition-colors hover:bg-cream/5"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href={accountHref}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-3 py-4 font-serif text-2xl text-cream transition-colors hover:bg-cream/5"
                >
                  {accountLabel}
                </Link>
              </nav>
              <div className="border-t border-cream/10 px-6 py-6">
                <Link
                  href="/book"
                  onClick={() => setMenuOpen(false)}
                  className="flex h-12 w-full items-center justify-center rounded-md bg-gold text-sm font-semibold uppercase tracking-wider text-primary-dark transition-colors hover:bg-gold-dark hover:text-cream"
                >
                  Book a Bay
                </Link>
                <div className="mt-5 flex justify-center opacity-60">
                  <BrandWordmark width={110} />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </header>
  );
}
