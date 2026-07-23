"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const sections: Array<{ heading: string; links: Array<{ href: string; label: string }> }> = [
  {
    heading: "Golf",
    links: [
      { href: "/simulators", label: "Simulator Experience" },
      { href: "/pricing", label: "Pricing" },
      { href: "/lessons", label: "Lessons" },
      { href: "/memberships", label: "Memberships" },
      { href: "/faq", label: "FAQs" },
    ],
  },
  {
    heading: "Leagues & Programs",
    links: [
      { href: "/leagues", label: "Leagues" },
      { href: "/youth-programs", label: "Youth Programs" },
      { href: "/tournaments", label: "Tournaments" },
    ],
  },
  {
    heading: "More",
    links: [
      { href: "/events", label: "Events" },
      { href: "/highland-stage", label: "Highland Stage" },
      { href: "/menu", label: "Food & Drinks" },
      { href: "/private-events", label: "Private Events" },
      { href: "/gift-cards", label: "Gift Cards" },
      { href: "/about", label: "About" },
      { href: "/opening-updates", label: "Opening Updates" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

export function MobileNav({
  canBook,
  signedIn,
  phone,
}: {
  canBook: boolean;
  signedIn: boolean;
  phone: string | null;
}) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        aria-label="Open menu"
        className="inline-flex h-11 w-11 items-center justify-center rounded-md text-charcoal transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold lg:hidden"
      >
        <Menu aria-hidden className="h-6 w-6" />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-charcoal/60 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-surface shadow-xl data-[state=open]:animate-in data-[state=open]:slide-in-from-right"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">
            Site navigation
          </DialogPrimitive.Title>
          <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
            <Logo variant="horizontal" width={150} height={32} />
            <DialogPrimitive.Close
              aria-label="Close menu"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <X aria-hidden className="h-6 w-6" />
            </DialogPrimitive.Close>
          </div>

          <nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto px-5 py-4">
            {sections.map((section) => (
              <div key={section.heading} className="mb-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold-dark">
                  {section.heading}
                </p>
                <ul className="space-y-1">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={cn(
                          "block rounded-md px-3 py-2.5 text-base font-medium transition-colors hover:bg-primary/5",
                          pathname === link.href ? "text-primary" : "text-charcoal",
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="space-y-2 border-t border-border/40 px-5 py-4">
            <Button asChild className="w-full">
              <Link href={canBook ? "/book" : "/opening-updates"}>
                {canBook ? "Book a Bay" : "Join the Opening List"}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={signedIn ? "/account" : "/login"}>
                {signedIn ? "My Account" : "Sign In"}
              </Link>
            </Button>
            {phone ? (
              <Button asChild variant="ghost" className="w-full">
                <a href={`tel:${phone.replace(/[^0-9+]/g, "")}`}>Call {phone}</a>
              </Button>
            ) : null}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
