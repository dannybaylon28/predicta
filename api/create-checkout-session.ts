import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireUser } from "./_lib/auth.js";
import { getTournamentConfig } from "./_lib/tournaments.js";
import { appBaseUrl, getStripe } from "./_lib/stripe.js";
import { mapStripeError } from "./_lib/stripeErrors.js";

type CheckoutBody = {
  tournamentId?: string;
  region?: "mx" | "intl";
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo no permitido." });
  }

  try {
    const user = await requireUser(req);
    const body = (req.body ?? {}) as CheckoutBody;
    const tournamentId = body.tournamentId ?? "world-cup-2026";
    const region = body.region === "mx" ? "mx" : "intl";
    const tournament = getTournamentConfig(tournamentId);

    const currency = region === "mx" ? "mxn" : "usd";
    const unitAmount = region === "mx" ? 12900 : 500;

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: unitAmount,
            product_data: {
              name: tournament.stripeProductName,
              description: "Ligas ilimitadas y miembros ilimitados para este torneo.",
            },
          },
        },
      ],
      metadata: {
        userId: user.uid,
        tournamentId,
        currency,
      },
      success_url: `${appBaseUrl()}/premium/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appBaseUrl()}/premium?cancelled=1`,
    });

    if (!session.url) {
      return res.status(500).json({ error: "Stripe no devolvio URL de checkout." });
    }

    return res.status(200).json({ url: session.url });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return res.status(401).json({ error: "Debes iniciar sesion." });
    }

    console.error("create-checkout-session", error);
    return res.status(500).json({
      error: mapStripeError(error, "No pudimos iniciar el pago."),
    });
  }
}
