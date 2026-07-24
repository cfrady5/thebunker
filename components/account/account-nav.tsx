"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { Select } from "@/components/ui/select";
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
  const router = useRouter();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const current = links.find((l) => isActive(l.href, l.exact));
  const currentHref = current?.href ?? "/account";

  return (
    <nav aria-label="Account navigation" className="lg:sticky lg:top-24 lg:self-start">
      {/* Mobile: a compact dropdown instead of a long horizontal scroll */}
      <div className="lg:hidden">
        <label htmlFor="account-nav-select" className="sr-only">
          Go to account section
        </label>
        <Select
          id="account-nav-select"
          value={currentHref}
          onChange={(e) => router.push(e.target.value)}
        >
          {links.map((link) => (
            <option key={link.href} value={link.href}>
              {link.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Desktop: vertical sidebar */}
      <ul className="hidden flex-col gap-1 lg:flex">
        {links.map((link) => {
          const active = isActive(link.href, link.exact);
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
