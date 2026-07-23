import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { InlineAlert } from "@/components/feedback/inline-alert";

export const metadata: Metadata = buildMetadata({
  title: "Participation Waiver",
  description:
    "The participation waiver signed by all players before using the simulators at The Bunker Indoor Golf.",
  path: "/policies/waiver",
});

export default function WaiverPage() {
  return (
    <section className="container max-w-3xl py-14 md:py-20">
      <h1 className="text-display-md font-semibold text-primary">Participation Waiver</h1>
      <div className="prose-policies mt-4">
        <p>
          Every player signs our participation waiver once, digitally, before their
          first session. Parents or guardians sign on behalf of players under 18.
          You can review and sign it in your account before you arrive, or at the
          front desk.
        </p>

        <div className="not-prose mt-6">
          <InlineAlert variant="warning" title="Placeholder — legal review required">
            The final waiver language will be prepared and approved by legal counsel
            before opening. The summary below describes what it will cover.
          </InlineAlert>
        </div>

        <h2>What the waiver covers</h2>
        <ul>
          <li>
            <strong>Assumption of risk</strong> — golf involves swinging clubs and
            fast-moving balls; players agree to use bays as directed and accept the
            inherent risks of the activity.
          </li>
          <li>
            <strong>Facility rules</strong> — one player in the hitting area at a
            time, follow staff instructions, and use equipment as intended.
          </li>
          <li>
            <strong>Minors</strong> — a parent or legal guardian consents for
            participants under 18 and confirms supervision requirements.
          </li>
          <li>
            <strong>Media consent (optional)</strong> — a separate, optional
            checkbox for photos taken at events. Declining never affects
            participation.
          </li>
        </ul>

        <h2>Questions</h2>
        <p>
          If you have questions about the waiver or need an accommodation to
          complete it, contact us and we&apos;ll help before your visit.
        </p>
      </div>
    </section>
  );
}
