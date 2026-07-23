import { getSiteSettings, bookingIsOpen } from "@/lib/settings";
import { getCurrentUser, isStaff } from "@/lib/permissions";
import { HeaderShell } from "@/components/layout/header-shell";

export async function SiteHeader() {
  const settings = await getSiteSettings();
  const user = await getCurrentUser();

  return (
    <HeaderShell
      canBook={bookingIsOpen(settings.business_mode)}
      signedIn={Boolean(user)}
      staff={isStaff(user)}
    />
  );
}
