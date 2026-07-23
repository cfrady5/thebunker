import { Button, Section, Text } from "@react-email/components";
import { EmailLayout, emailStyles } from "@/emails/components/layout";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Shared confirmation for league, program and event registrations. */
export function RegistrationConfirmationEmail({
  firstName,
  registrationName,
  registrationKind,
  detailsLine,
  participantName,
}: {
  firstName: string;
  registrationName: string;
  registrationKind: "league" | "program" | "event";
  detailsLine: string | null;
  participantName: string | null;
}) {
  const kindLabel =
    registrationKind === "league"
      ? "league registration"
      : registrationKind === "program"
        ? "program registration"
        : "event registration";

  return (
    <EmailLayout preview={`You're registered: ${registrationName}`}>
      <Text style={emailStyles.h1}>You&apos;re in, {firstName}!</Text>
      <Text style={emailStyles.p}>
        Your {kindLabel} is confirmed
        {participantName ? ` for ${participantName}` : ""}:
      </Text>
      <Section style={emailStyles.summaryCard}>
        <Text style={emailStyles.summaryLabel}>Registered for</Text>
        <Text style={emailStyles.summaryValue}>{registrationName}</Text>
        {detailsLine ? (
          <>
            <Text style={emailStyles.summaryLabel}>Details</Text>
            <Text style={{ ...emailStyles.summaryValue, marginBottom: 0 }}>
              {detailsLine}
            </Text>
          </>
        ) : null}
      </Section>
      <Text style={emailStyles.p}>
        We&apos;ll email schedules and anything you need to know before the first
        session. You can review your registrations anytime in your account.
      </Text>
      <Button href={`${SITE_URL}/account`} style={emailStyles.button}>
        View My Account
      </Button>
    </EmailLayout>
  );
}
