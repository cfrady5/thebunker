import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Minimal Square REST client (no SDK dependency). Sandbox and
 * production are selected by SQUARE_ENVIRONMENT. All calls are
 * server-side only; the access token never reaches the browser.
 */

const SQUARE_VERSION = "2025-01-23";

function baseUrl(): string {
  return process.env.SQUARE_ENVIRONMENT === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

export function isSquareConfigured(): boolean {
  return Boolean(process.env.SQUARE_ACCESS_TOKEN);
}

export class SquareError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail: unknown,
  ) {
    super(message);
  }
}

async function squareFetch<T>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) throw new SquareError("Square not configured", 503, null);

  const res = await fetch(`${baseUrl()}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      "Square-Version": SQUARE_VERSION,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  const json = (await res.json().catch(() => ({}))) as T & { errors?: unknown };
  if (!res.ok) {
    console.error(`Square ${path} failed (${res.status}):`, JSON.stringify(json.errors));
    throw new SquareError(`Square request failed: ${path}`, res.status, json.errors);
  }
  return json;
}

// ---------- Locations ----------

interface SquareLocation {
  id: string;
  name: string;
  status: string;
}

let cachedLocationId: string | null = null;

/** Uses SQUARE_LOCATION_ID when set, else the first active location. */
export async function getLocationId(): Promise<string> {
  const configured = process.env.SQUARE_LOCATION_ID;
  if (configured) return configured;
  if (cachedLocationId) return cachedLocationId;

  const data = await squareFetch<{ locations?: SquareLocation[] }>("/v2/locations");
  const active = (data.locations ?? []).find((l) => l.status === "ACTIVE");
  if (!active) throw new SquareError("No active Square location", 500, null);
  cachedLocationId = active.id;
  return active.id;
}

export async function listLocations(): Promise<SquareLocation[]> {
  const data = await squareFetch<{ locations?: SquareLocation[] }>("/v2/locations");
  return data.locations ?? [];
}

// ---------- Checkout (payment links) ----------

export interface PaymentLinkResult {
  url: string;
  orderId: string;
  paymentLinkId: string;
}

/**
 * Creates a Square-hosted checkout page for a booking. The order's
 * line item carries the bay/time description, so every reservation
 * shows up readably in the Square Dashboard.
 */
export async function createBookingPaymentLink(params: {
  idempotencyKey: string;
  referenceId: string; // booking number
  description: string;
  amountCents: number;
  buyerEmail?: string;
  redirectUrl: string;
}): Promise<PaymentLinkResult> {
  const locationId = await getLocationId();
  const data = await squareFetch<{
    payment_link?: { id: string; url: string; order_id: string };
  }>("/v2/online-checkout/payment-links", {
    method: "POST",
    body: {
      idempotency_key: params.idempotencyKey,
      order: {
        location_id: locationId,
        reference_id: params.referenceId,
        line_items: [
          {
            name: params.description,
            quantity: "1",
            base_price_money: { amount: params.amountCents, currency: "USD" },
          },
        ],
      },
      checkout_options: {
        redirect_url: params.redirectUrl,
        ask_for_shipping_address: false,
        allow_tipping: false,
      },
      pre_populated_data: params.buyerEmail
        ? { buyer_email: params.buyerEmail }
        : undefined,
      payment_note: params.referenceId,
    },
  });

  if (!data.payment_link?.url) {
    throw new SquareError("Square returned no payment link", 500, data);
  }
  return {
    url: data.payment_link.url,
    orderId: data.payment_link.order_id,
    paymentLinkId: data.payment_link.id,
  };
}

// ---------- Payments & refunds ----------

export interface SquarePayment {
  id: string;
  status: "APPROVED" | "PENDING" | "COMPLETED" | "CANCELED" | "FAILED";
  order_id?: string;
  amount_money?: { amount: number; currency: string };
  buyer_email_address?: string;
  refunded_money?: { amount: number };
}

export async function getPayment(paymentId: string): Promise<SquarePayment> {
  const data = await squareFetch<{ payment: SquarePayment }>(
    `/v2/payments/${paymentId}`,
  );
  return data.payment;
}

export async function createRefund(params: {
  idempotencyKey: string;
  paymentId: string;
  amountCents: number;
  reason?: string;
}): Promise<{ id: string; status: string }> {
  const data = await squareFetch<{ refund: { id: string; status: string } }>(
    "/v2/refunds",
    {
      method: "POST",
      body: {
        idempotency_key: params.idempotencyKey,
        payment_id: params.paymentId,
        amount_money: { amount: params.amountCents, currency: "USD" },
        reason: params.reason?.slice(0, 190),
      },
    },
  );
  return data.refund;
}

// ---------- Webhook signature verification ----------

/**
 * Square signs webhooks with HMAC-SHA256 over (notificationUrl +
 * rawBody), base64-encoded, in the x-square-hmacsha256-signature
 * header.
 */
export function verifySquareSignature(params: {
  rawBody: string;
  signatureHeader: string | null;
  notificationUrl: string;
  signatureKey: string;
}): boolean {
  if (!params.signatureHeader) return false;
  const expected = createHmac("sha256", params.signatureKey)
    .update(params.notificationUrl + params.rawBody)
    .digest();
  let provided: Buffer;
  try {
    provided = Buffer.from(params.signatureHeader, "base64");
  } catch {
    return false;
  }
  return (
    expected.length === provided.length && timingSafeEqual(expected, provided)
  );
}

/**
 * Verifies the signature against several candidate notification URLs
 * and returns the one that matched (or null). Square signs with the
 * exact Notification URL configured on the subscription, which may
 * differ from a hardcoded site URL (a different Vercel alias, a
 * trailing slash, http vs https). Trying the URL Square actually
 * called — reconstructed from the request — makes verification
 * resilient without weakening it: the signing key is still required.
 */
export function verifySquareSignatureAny(params: {
  rawBody: string;
  signatureHeader: string | null;
  signatureKey: string;
  candidateUrls: string[];
}): string | null {
  if (!params.signatureHeader) return null;
  for (const url of params.candidateUrls) {
    if (
      verifySquareSignature({
        rawBody: params.rawBody,
        signatureHeader: params.signatureHeader,
        notificationUrl: url,
        signatureKey: params.signatureKey,
      })
    ) {
      return url;
    }
  }
  return null;
}
