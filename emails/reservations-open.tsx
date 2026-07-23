import { Button, Text } from "@react-email/components";
import { EmailLayout, emailStyles } from "@/emails/components/layout";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function ReservationsOpenEmail({ firstName }: { firstName: string }) {
  return (
    <EmailLayout preview="Bay reservations are officially open at The Bunker.">
      <Text style={emailStyles.h1}>It&apos;s time, {firstName}. ⛳</Text>
      <Text style={emailStyles.p}>
        Bay reservations at The Bunker are officially open — and as an opening-list
        member, you&apos;re hearing it first.
      </Text>
      <Text style={emailStyles.p}>
        Pick your date, choose a session length and bring up to five friends. First
        time on a simulator? We&apos;ll get you set up when you arrive.
      </Text>
      <Button href={`${SITE_URL}/book`} style={emailStyles.button}>
        Book Your First Bay
      </Button>
      <Text style={{ ...emailStyles.p, marginTop: "20px" }}>
        See you at The Bunker,
        <br />
        Jay &amp; Amanda
      </Text>
    </EmailLayout>
  );
}
