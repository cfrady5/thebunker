import { Text } from "@react-email/components";
import { EmailLayout, emailStyles } from "@/emails/components/layout";

export function OpeningListEmail({ firstName }: { firstName: string }) {
  return (
    <EmailLayout preview="You're on the list — we'll see you at The Bunker.">
      <Text style={emailStyles.h1}>You&apos;re on the list, {firstName}!</Text>
      <Text style={emailStyles.p}>
        Thanks for joining The Bunker&apos;s opening list. We&apos;re building
        Linton&apos;s home for year-round golf — simulator bays, lessons, leagues,
        youth programs and a comfortable place to hang out with food and drinks.
      </Text>
      <Text style={emailStyles.p}>
        You&apos;ll be the first to hear when league registration opens, when
        memberships go on sale, and when it&apos;s time to book your first bay.
      </Text>
      <Text style={emailStyles.p}>
        See you soon,
        <br />
        Jay &amp; Amanda
      </Text>
    </EmailLayout>
  );
}
