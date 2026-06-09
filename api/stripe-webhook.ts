import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buffer } from "micro";
import { grantEntitlement } from "./_lib/entitlements.js";
import { getStripe } from "./_lib/stripe.js";

type PaidCheckoutSession = {
  id: string;
  payment_status?: string;
  metadata?: {
    userId?: string;
    tournamentId?: string;
    currency?: string;
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo no permitido." });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(500).json({ error: "Webhook no configurado." });
  }

  const signature = req.headers["stripe-signature"];
  if (!signature || Array.isArray(signature)) {
    return res.status(400).json({ error: "Falta firma de Stripe." });
  }

  try {
    const stripe = getStripe();
    const rawBody = await buffer(req);
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as PaidCheckoutSession;

      if (session.payment_status === "paid" && session.metadata?.userId && session.metadata.tournamentId) {
        const currency = session.metadata.currency === "mxn" ? "mxn" : "usd";
        await grantEntitlement({
          userId: session.metadata.userId,
          tournamentId: session.metadata.tournamentId,
          currency,
          amount: currency === "mxn" ? 129 : 5,
          stripeSessionId: session.id,
        });
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("stripe-webhook", error);
    return res.status(400).json({ error: "Webhook invalido." });
  }
}
