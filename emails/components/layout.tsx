import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Shared branded shell for all transactional email. */
export function EmailLayout({
  preview,
  children,
}: {
  preview: string;
  children: ReactNode;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#F5E8C8", fontFamily: "Helvetica, Arial, sans-serif", margin: 0 }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "24px 12px" }}>
          <Section
            style={{
              backgroundColor: "#123D2A",
              borderRadius: "10px 10px 0 0",
              padding: "24px",
              textAlign: "center" as const,
            }}
          >
            <Img
              src={`${SITE_URL}/brand/logo-full.svg`}
              alt="The Bunker Indoor Golf"
              width="96"
              height="112"
              style={{ margin: "0 auto" }}
            />
          </Section>
          <Section
            style={{
              backgroundColor: "#FFFDF8",
              borderRadius: "0 0 10px 10px",
              padding: "32px 28px",
            }}
          >
            {children}
            <Hr style={{ borderColor: "#E8D3A5", margin: "28px 0 16px" }} />
            <Text style={{ color: "#4A514C", fontSize: "12px", lineHeight: "18px", margin: 0 }}>
              The Bunker Indoor Golf · Linton, Indiana
              <br />
              Questions? Reply to this email and we&apos;ll help.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export const emailStyles = {
  h1: {
    color: "#123D2A",
    fontFamily: "Georgia, serif",
    fontSize: "24px",
    lineHeight: "32px",
    margin: "0 0 16px",
  },
  p: {
    color: "#1C211E",
    fontSize: "15px",
    lineHeight: "24px",
    margin: "0 0 14px",
  },
  button: {
    backgroundColor: "#123D2A",
    borderRadius: "8px",
    color: "#F5E8C8",
    display: "inline-block",
    fontSize: "15px",
    fontWeight: 600,
    padding: "12px 24px",
    textDecoration: "none",
  },
  summaryCard: {
    backgroundColor: "#FAF8F1",
    border: "1px solid #E8D3A5",
    borderRadius: "8px",
    padding: "18px 20px",
    margin: "0 0 16px",
  },
  summaryLabel: {
    color: "#8D6B2E",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    margin: "0 0 2px",
    textTransform: "uppercase" as const,
  },
  summaryValue: {
    color: "#1C211E",
    fontSize: "15px",
    margin: "0 0 12px",
  },
};
