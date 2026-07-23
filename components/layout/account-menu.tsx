"use client";

import Link from "next/link";
import { CalendarDays, CircleUserRound, LayoutDashboard, LogIn, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AccountMenu({
  signedIn,
  firstName,
  staff,
}: {
  signedIn: boolean;
  firstName: string | null;
  staff: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={signedIn ? "Account menu" : "Sign in or create account"}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-charcoal-muted transition-colors hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        <CircleUserRound aria-hidden className="h-6 w-6" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {signedIn ? (
          <>
            <DropdownMenuLabel>
              {firstName ? `Hi, ${firstName}` : "Your account"}
            </DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/account">
                <User aria-hidden /> Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/account/bookings">
                <CalendarDays aria-hidden /> My reservations
              </Link>
            </DropdownMenuItem>
            {staff ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <LayoutDashboard aria-hidden /> Staff dashboard
                  </Link>
                </DropdownMenuItem>
              </>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/logout">Sign out</Link>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link href="/login">
                <LogIn aria-hidden /> Sign in
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/signup">
                <User aria-hidden /> Create account
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
