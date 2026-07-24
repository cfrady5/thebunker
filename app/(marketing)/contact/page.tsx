import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSiteSettings } from "@/lib/settings";
import { SectionHeading } from "@/components/marketing/section-heading";
import { ContactForm } from "@/components/marketing/contact-form";

export const metadata: Metadata = buildMetadata({
  title: "Contact — Get in Touch with The Bunker",
  description:
    "Questions about bookings, leagues, lessons or events at The Bunker Indoor Golf in Linton, Indiana? Send us a message.",
  path: "/contact",
});

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const [settings, params] = await Promise.all([getSiteSettings(), searchParams]);

  return (
    <section className="container py-14 md:py-20">
      <SectionHeading
        eyebrow="Contact"
        title="Say Hello"
        description="Questions, ideas, league interest, event plans — we read everything and reply quickly."
      />
      <div className="mx-auto mt-12 grid max-w-4xl gap-10 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <div className="flex items-start gap-3">
            <Mail aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
            <div>
              <p className="font-semibold text-charcoal">Email</p>
              <p className="text-sm text-charcoal-muted">
                {settings.facility.email ?? "Use the form and we'll reply by email."}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
            <div>
              <p className="font-semibold text-charcoal">Phone</p>
              <p className="text-sm text-charcoal-muted">
                {settings.facility.phone ?? "Published closer to opening"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
            <div>
              <p className="font-semibold text-charcoal">Location</p>
              <p className="text-sm text-charcoal-muted">
                {settings.facility.address_line1 ? (
                  <>
                    {settings.facility.address_line1}
                    <br />
                  </>
                ) : null}
                {settings.facility.city}, {settings.facility.state}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border/40 bg-surface p-6 md:p-8 lg:col-span-3">
          <ContactForm defaultSubject={params.subject} />
        </div>
      </div>
    </section>
  );
}
