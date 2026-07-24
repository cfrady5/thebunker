"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarPlus, MapPin, Phone, Sparkles } from "lucide-react";

/**
 * Sticky bottom action bar on mobile. Call/Directions appear only
 * once the facility is operating and contact details are final.
 * Hidden on /book, where the booking flow renders its own sticky
 * "Continue" bar.
 */
export function MobileActionBar({
  canBook,
  phone,
  directionsUrl,
}: {
  canBook: boolean;
  phone: string | null;
  directionsUrl: string | null;
}) {
  const pathname = usePathname();
  if (pathname === "/book") return null;

  const showContact = canBook && (phone || directionsUrl);

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/40 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="flex items-stretch">
        <Link
          href={canBook ? "/book" : "/opening-updates"}
          className="flex min-h-[52px] flex-1 items-center justify-center gap-2 bg-primary text-sm font-semibold text-cream transition-colors hover:bg-primary-light"
        >
          {canBook ? (
            <>
              <CalendarPlus aria-hidden className="h-4 w-4" /> Book a Bay
            </>
          ) : (
            <>
              <Sparkles aria-hidden className="h-4 w-4" /> Join the Opening List
            </>
          )}
        </Link>
        {showContact && phone ? (
          <a
            href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
            className="flex min-h-[52px] flex-1 items-center justify-center gap-2 text-sm font-semibold text-primary"
          >
            <Phone aria-hidden className="h-4 w-4" /> Call
          </a>
        ) : null}
        {showContact && directionsUrl ? (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[52px] flex-1 items-center justify-center gap-2 text-sm font-semibold text-primary"
          >
            <MapPin aria-hidden className="h-4 w-4" /> Directions
          </a>
        ) : null}
      </div>
    </div>
  );
}
