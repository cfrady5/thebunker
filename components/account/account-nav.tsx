"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  CreditCard,
  FileSignature,
  Gift,
  GraduationCap,
  LayoutDashboard,
  Lock,
  Medal,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/account/bookings", label: "Reservations", icon: CalendarDays },
  { href: "/account/memberships", label: "Membership", icon: Medal },
  { href: "/account/league-registrations", label: "Leagues", icon: Users },
  { href: "/account/programs", label: "Lessons & Programs", icon: GraduationCap },
  { href: "/account/credits", label: "Credits", icon: Wallet },
  { href: "/account/gift-cards", label: "Gift Cards", icon: Gift },
  { href: "/account/payments", label: "Payments", icon: CreditCard },
  { href: "/account/household", label: "Household", icon: Users },
  { href: "/account/waivers", label: "Waivers", icon: FileSignature },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
  { href: "/account/profile", label: "Profile", icon: User },
  { href: "/account/security", label: "Security", icon: Lock },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account navigation" className="lg:sticky lg:top-24 lg:self-start">
      <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {links.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-charcoal-muted hover:bg-primary/5 hover:text-primary",
                )}
              >
                <link.icon aria-hidden className="h-4 w-4" />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
