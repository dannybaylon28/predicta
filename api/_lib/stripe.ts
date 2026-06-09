import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeClient) return stripeClient;

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error("STRIPE_SECRET_KEY no esta configurado.");
  }

  stripeClient = new Stripe(secret);
  return stripeClient;
}

export function appBaseUrl(): string {
  return (
    process.env.APP_URL?.trim() ||
    process.env.VITE_APP_URL?.trim() ||
    "https://predictaclub.com"
  ).replace(/\/$/, "");
}
