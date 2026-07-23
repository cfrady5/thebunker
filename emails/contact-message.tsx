import { Text } from "@react-email/components";
import { EmailLayout, emailStyles } from "@/emails/components/layout";

export function ContactMessageEmail({
  name,
  email,
  subject,
  message,
}: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  return (
    <EmailLayout preview={`Message from ${name}: ${subject}`}>
      <Text style={emailStyles.h1}>Website message</Text>
      <Text style={emailStyles.p}>
        <strong>From:</strong> {name} ({email})
      </Text>
      <Text style={emailStyles.p}>
        <strong>Subject:</strong> {subject}
      </Text>
      <Text style={{ ...emailStyles.p, whiteSpace: "pre-wrap" as const }}>{message}</Text>
      <Text style={emailStyles.p}>Reply to this email to respond directly.</Text>
    </EmailLayout>
  );
}
