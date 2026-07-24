"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  CreditCard,
  FileClock,
  Gift,
  GraduationCap,
  LandPlot,
  LayoutDashboard,
  Mail,
  Menu,
  Newspaper,
  PartyPopper,
  Percent,
  Settings,
  Clock,
  Trophy,
  Users,
  UsersRound,
  UtensilsCrossed,
  X,
} from "lucide-react";
import type { StaffRole } from "@/types";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: StaffRole[]; // undefined = all staff
}

const NAV: Array<{ heading: string; items: NavItem[] }> = [
  {
    heading: "Operations",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/bookings", label: "Bookings", icon: ClipboardList },
      { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
      { href: "/admin/customers", label: "Customers", icon: Users },
      {
        href: "/admin/private-events",
        label: "Private Events",
        icon: PartyPopper,
        roles: ["owner", "manager", "marketing"],
      },
    ],
  },
  {
    heading: "Facility",
    items: [
      { href: "/admin/bays", label: "Bays", icon: LandPlot, roles: ["owner", "manager"] },
      { href: "/admin/hours", label: "Hours", icon: Clock, roles: ["owner", "manager"] },
      {
        href: "/admin/blackouts",
        label: "Blackouts",
        icon: CalendarRange,
        roles: ["owner", "manager", "front_desk"],
      },
      {
        href: "/admin/pricing",
        label: "Pricing",
        icon: CreditCard,
        roles: ["owner", "manager"],
      },
    ],
  },
  {
    heading: "Programs",
    items: [
      {
        href: "/admin/leagues",
        label: "Leagues",
        icon: Trophy,
        roles: ["owner", "manager"],
      },
      {
        href: "/admin/programs",
        label: "Lessons & Programs",
        icon: GraduationCap,
        roles: ["owner", "manager", "instructor"],
      },
      {
        href: "/admin/events",
        label: "Events",
        icon: CalendarDays,
        roles: ["owner", "manager", "marketing"],
      },
      {
        href: "/admin/memberships",
        label: "Memberships",
        icon: UsersRound,
        roles: ["owner", "manager"],
      },
    ],
  },
  {
    heading: "Commerce & content",
    items: [
      {
        href: "/admin/menu",
        label: "Menu",
        icon: UtensilsCrossed,
        roles: ["owner", "manager", "kitchen", "marketing"],
      },
      {
        href: "/admin/gift-cards",
        label: "Gift Cards",
        icon: Gift,
        roles: ["owner", "manager"],
      },
      {
        href: "/admin/discounts",
        label: "Discounts",
        icon: Percent,
        roles: ["owner", "manager"],
      },
      {
        href: "/admin/content",
        label: "Site Content",
        icon: Newspaper,
        roles: ["owner", "manager", "marketing"],
      },
      {
        href: "/admin/email",
        label: "Opening List",
        icon: Mail,
        roles: ["owner", "manager", "marketing"],
      },
    ],
  },
  {
    heading: "Insights & admin",
    items: [
      {
        href: "/admin/reports",
        label: "Reports",
        icon: BarChart3,
        roles: ["owner", "manager"],
      },
      { href: "/admin/team", label: "Team", icon: Users, roles: ["owner"] },
      {
        href: "/admin/audit-log",
        label: "Audit Log",
        icon: FileClock,
        roles: ["owner", "manager"],
      },
      {
        href: "/admin/settings",
        label: "Settings",
        icon: Settings,
        roles: ["owner", "manager"],
      },
    ],
  },
];

export function AdminSidebar({
  userName,
  roles,
}: {
  userName: string;
  roles: StaffRole[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const visible = NAV.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.roles || item.roles.some((r) => roles.includes(r)),
    ),
  })).filter((group) => group.items.length > 0);

  const nav = (
    <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto px-3 py-4">
      {visible.map((group) => (
        <div key={group.heading} className="mb-5">
          <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-widest text-cream/50">
            {group.heading}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    // Prefetch is disabled here on purpose: the sidebar
                    // renders every admin link at once, and prefetching
                    // them all fires ~24 concurrent authenticated
                    // requests that race Supabase's auth-token refresh,
                    // intermittently bouncing a tab to /login. Navigation
                    // still works instantly enough without it.
                    prefetch={false}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                      active
                        ? "bg-cream/10 text-cream"
                        : "text-cream/70 hover:bg-cream/5 hover:text-cream",
                    )}
                  >
                    <item.icon aria-hidden className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-cream/10 bg-primary-dark px-4 py-3 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <Image src="/brand/logo-cream.svg" alt="" width={28} height={33} aria-hidden />
          <span className="font-serif font-semibold text-cream">Bunker Admin</span>
        </Link>
        <button
          aria-label={open ? "Close admin menu" : "Open admin menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="rounded-md p-2 text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          {open ? <X aria-hidden /> : <Menu aria-hidden />}
        </button>
      </div>
      {open ? (
        <div className="fixed inset-0 z-30 flex flex-col bg-primary-dark pt-14 lg:hidden">
          {nav}
        </div>
      ) : null}
      {/* Spacer for the fixed mobile bar */}
      <div className="h-12 lg:hidden" aria-hidden />

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 flex-col border-r border-cream/10 bg-primary-dark lg:flex">
        <div className="flex items-center gap-2.5 border-b border-cream/10 px-4 py-4">
          <Image src="/brand/logo-cream.svg" alt="" width={32} height={37} aria-hidden />
          <div>
            <p className="font-serif font-semibold leading-tight text-cream">
              The Bunker
            </p>
            <p className="text-xs text-cream/60">Staff dashboard</p>
          </div>
        </div>
        {nav}
        <div className="border-t border-cream/10 px-4 py-3">
          <p className="truncate text-sm font-medium text-cream">{userName}</p>
          <p className="text-xs capitalize text-cream/60">
            {roles.join(", ").replace(/_/g, " ")}
          </p>
          <div className="mt-2 flex gap-3 text-xs">
            <Link href="/" className="text-cream/70 hover:text-cream">
              View site
            </Link>
            <Link href="/logout" className="text-cream/70 hover:text-cream">
              Sign out
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
