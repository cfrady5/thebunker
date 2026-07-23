import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";
import { AdminPageHeader } from "@/components/admin/ui";
import { BusinessModeSwitcher } from "@/components/admin/business-mode-switcher";
import { FacilityForm, HeroForm } from "@/components/admin/content-forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Site Content" };

export default async function AdminContentPage() {
  const settings = await getSiteSettings();

  return (
    <div className="max-w-3xl">
      <AdminPageHeader
        title="Site Content"
        description="Everyday content changes without a code deploy. Menu, events, leagues and updates have their own sections."
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Business mode</CardTitle>
          </CardHeader>
          <CardContent>
            <BusinessModeSwitcher current={settings.business_mode} />
            <p className="mt-3 text-xs text-muted-foreground">
              Controls the site-wide experience: pre-opening shows interest capture,
              reservations open turns on booking, temporarily closed pauses
              everything with a notice.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Homepage hero</CardTitle>
          </CardHeader>
          <CardContent>
            <HeroForm initial={settings.hero} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact &amp; location</CardTitle>
          </CardHeader>
          <CardContent>
            <FacilityForm
              initial={{
                phone: settings.facility.phone,
                email: settings.facility.email,
                address_line1: settings.facility.address_line1,
                postal_code: settings.facility.postal_code,
              }}
            />
            <p className="mt-3 text-xs text-muted-foreground">
              Phone and address appear across the site (footer, contact page, mobile
              action bar) as soon as they&apos;re saved.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
