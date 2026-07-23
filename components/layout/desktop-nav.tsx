"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const golfLinks = [
  { href: "/simulators", label: "Simulator Experience" },
  { href: "/pricing", label: "Pricing" },
  { href: "/lessons", label: "Lessons" },
  { href: "/memberships", label: "Memberships" },
  { href: "/faq", label: "FAQs" },
];

const programLinks = [
  { href: "/leagues", label: "Leagues" },
  { href: "/youth-programs", label: "Youth Programs" },
  { href: "/lessons", label: "Lessons & Clinics" },
  { href: "/tournaments", label: "Tournaments" },
];

function NavDropdown({
  label,
  links,
  active,
}: {
  label: string;
  links: Array<{ href: string; label: string }>;
  active: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
          active ? "text-primary" : "text-charcoal-muted",
        )}
      >
        {label}
        <ChevronDown aria-hidden className="h-3.5 w-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {links.map((link) => (
          <DropdownMenuItem key={link.href} asChild>
            <Link href={link.href}>{link.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DesktopNav() {
  const pathname = usePathname();

  const linkClass = (href: string) =>
    cn(
      "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
      pathname === href || pathname.startsWith(`${href}/`)
        ? "text-primary"
        : "text-charcoal-muted",
    );

  return (
    <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
      <NavDropdown
        label="Golf"
        links={golfLinks}
        active={["/golf", "/simulators", "/lessons"].some((p) => pathname.startsWith(p))}
      />
      <NavDropdown
        label="Leagues & Programs"
        links={programLinks}
        active={["/leagues", "/youth-programs", "/tournaments"].some((p) =>
          pathname.startsWith(p),
        )}
      />
      <Link href="/events" className={linkClass("/events")}>
        Events
      </Link>
      <Link href="/menu" className={linkClass("/menu")}>
        Food &amp; Drinks
      </Link>
      <Link href="/pricing" className={linkClass("/pricing")}>
        Pricing
      </Link>
    </nav>
  );
}
