import Stripe from "stripe";

let stripeClient: ReturnType<typeof createStripeClient> | null = null;

function createStripeClient(secret: string) {
  return new Stripe(secret, {
    apiVersion: "2026-05-27.dahlia",
  });
}

export function getStripe() {
  if (stripeClient) return stripeClient;

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error("STRIPE_SECRET_KEY no esta configurado.");
  }

  stripeClient = createStripeClient(secret);
  return stripeClient;
}

export function appBaseUrl(): string {
  return (
    process.env.APP_URL?.trim() ||
    process.env.VITE_APP_URL?.trim() ||
    "https://predictaclub.com"
  ).replace(/\/$/, "");
}
