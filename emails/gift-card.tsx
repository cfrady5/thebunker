import { Button, Section, Text } from "@react-email/components";
import { EmailLayout, emailStyles } from "@/emails/components/layout";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function GiftCardEmail({
  recipientName,
  senderName,
  amountCents,
  code,
  personalMessage,
}: {
  recipientName: string;
  senderName: string;
  amountCents: number;
  /** Raw code — appears only in this email, never stored. */
  code: string;
  personalMessage: string | null;
}) {
  return (
    <EmailLayout preview={`${senderName} sent you a Bunker gift card!`}>
      <Text style={emailStyles.h1}>You&apos;ve got golf, {recipientName}!</Text>
      <Text style={emailStyles.p}>
        {senderName} sent you a ${(amountCents / 100).toFixed(2)} gift card for The
        Bunker Indoor Golf in Linton — good for simulator time, lessons, food and
        drinks.
      </Text>
      {personalMessage ? (
        <Section style={emailStyles.summaryCard}>
          <Text style={{ ...emailStyles.summaryValue, fontStyle: "italic", marginBottom: 0 }}>
            “{personalMessage}”
          </Text>
        </Section>
      ) : null}
      <Section style={emailStyles.summaryCard}>
        <Text style={emailStyles.summaryLabel}>Your gift card code</Text>
        <Text
          style={{
            ...emailStyles.summaryValue,
            fontFamily: "monospace",
            fontSize: "20px",
            letterSpacing: "1px",
            marginBottom: 0,
          }}
        >
          {code}
        </Text>
      </Section>
      <Text style={emailStyles.p}>
        Keep this email — you&apos;ll enter the code at checkout. Balances never
        need to be used all at once.
      </Text>
      <Button href={`${SITE_URL}/book`} style={emailStyles.button}>
        Book a Bay
      </Button>
    </EmailLayout>
  );
}
