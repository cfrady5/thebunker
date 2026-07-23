import Link from "next/link";
import { getSiteSettings, bookingIsOpen } from "@/lib/settings";
import { getCurrentUser, isStaff } from "@/lib/permissions";
import { LogoLink } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { DesktopNav } from "@/components/layout/desktop-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AccountMenu } from "@/components/layout/account-menu";

export async function SiteHeader() {
  const settings = await getSiteSettings();
  const user = await getCurrentUser();
  const canBook = bookingIsOpen(settings.business_mode);

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <div className="container flex h-16 items-center justify-between gap-4 lg:h-[72px]">
        <LogoLink className="shrink-0" width={172} height={37} />

        <DesktopNav />

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <AccountMenu
              signedIn={Boolean(user)}
              firstName={user?.profile.first_name ?? null}
              staff={isStaff(user)}
            />
          </div>
          <Button asChild size="sm" className="hidden md:inline-flex lg:h-11 lg:px-5">
            <Link href={canBook ? "/book" : "/opening-updates"}>
              {canBook ? "Book a Bay" : "Join the Opening List"}
            </Link>
          </Button>
          <MobileNav
            canBook={canBook}
            signedIn={Boolean(user)}
            phone={settings.facility.phone}
          />
        </div>
      </div>
    </header>
  );
}
