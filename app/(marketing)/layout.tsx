import { SiteHeader } from "@/components/layout/header";
import { SiteFooter } from "@/components/layout/footer";
import { MobileActionBar } from "@/components/layout/mobile-action-bar";
import { getSiteSettings, bookingIsOpen } from "@/lib/settings";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  const canBook = bookingIsOpen(settings.business_mode);
  const directionsUrl = settings.facility.address_line1
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${settings.facility.name} ${settings.facility.address_line1} ${settings.facility.city} ${settings.facility.state}`,
      )}`
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main-content" className="flex-1 pb-14 md:pb-0">
        {children}
      </main>
      <SiteFooter />
      <MobileActionBar
        canBook={canBook}
        phone={settings.facility.phone}
        directionsUrl={directionsUrl}
      />
    </div>
  );
}
