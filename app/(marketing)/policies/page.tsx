import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ShieldCheck, Undo2, UserCheck } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = buildMetadata({
  title: "Policies",
  description:
    "Cancellation, waiver, privacy and terms for The Bunker Indoor Golf in Linton, Indiana.",
  path: "/policies",
});

const policies = [
  {
    href: "/policies/cancellation",
    icon: Undo2,
    title: "Cancellation Policy",
    body: "Refund windows, rescheduling and no-show rules for reservations, leagues and programs.",
  },
  {
    href: "/policies/waiver",
    icon: UserCheck,
    title: "Participation Waiver",
    body: "The waiver every player signs before using the simulators, including minors.",
  },
  {
    href: "/policies/privacy",
    icon: ShieldCheck,
    title: "Privacy Policy",
    body: "What we collect, how we use it and your choices.",
  },
  {
    href: "/policies/terms",
    icon: FileText,
    title: "Terms of Service",
    body: "The agreement covering accounts, bookings, memberships and facility use.",
  },
];

export default function PoliciesPage() {
  return (
    <section className="container max-w-3xl py-14 md:py-20">
      <SectionHeading eyebrow="The fine print" title="Policies" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {policies.map((p) => (
          <Link key={p.href} href={p.href} className="group">
            <Card className="h-full transition-shadow group-hover:shadow-card-hover">
              <CardContent className="p-6">
                <p.icon aria-hidden className="h-6 w-6 text-gold-dark" />
                <h2 className="mt-3 font-serif text-lg font-semibold text-primary">
                  {p.title}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-charcoal-muted">{p.body}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
