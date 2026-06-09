import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireUser } from "./_lib/auth.js";
import { grantEntitlement } from "./_lib/entitlements.js";
import { getStripe } from "./_lib/stripe.js";

type VerifyBody = {
  sessionId?: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo no permitido." });
  }

  try {
    const user = await requireUser(req);
    const body = (req.body ?? {}) as VerifyBody;
    const sessionId = body.sessionId?.trim();

    if (!sessionId) {
      return res.status(400).json({ error: "Falta sessionId." });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(200).json({ active: false });
    }

    const sessionUserId = session.metadata?.userId;
    const tournamentId = session.metadata?.tournamentId ?? "world-cup-2026";
    const currency = session.metadata?.currency === "mxn" ? "mxn" : "usd";

    if (sessionUserId !== user.uid) {
      return res.status(403).json({ error: "La sesion no pertenece a este usuario." });
    }

    await grantEntitlement({
      userId: user.uid,
      tournamentId,
      currency,
      amount: currency === "mxn" ? 129 : 5,
      stripeSessionId: session.id,
    });

    return res.status(200).json({ active: true, tournamentId });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return res.status(401).json({ error: "Debes iniciar sesion." });
    }

    console.error("verify-checkout-session", error);
    return res.status(500).json({ error: "No pudimos verificar el pago." });
  }
}
