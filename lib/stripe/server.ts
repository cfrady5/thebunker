import "server-only";
import Stripe from "stripe";

/**
 * Server-side Stripe client. Returns null when the secret key is
 * absent so the app can render and explain unconfigured payments
 * instead of crashing.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { typescript: true });
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
