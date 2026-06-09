import { auth } from "../firebase";
import { DEFAULT_TOURNAMENT_ID } from "../constants/plan";

export type BillingRegion = "mx" | "intl";

export function detectBillingRegion(): BillingRegion {
  const locale = navigator.language?.toLowerCase() ?? "";
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";

  if (locale.endsWith("-mx") || locale === "es-mx" || timezone === "America/Mexico_City") {
    return "mx";
  }

  return "intl";
}

export async function startPremiumCheckout(
  tournamentId = DEFAULT_TOURNAMENT_ID,
  region: BillingRegion = detectBillingRegion(),
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Debes iniciar sesion para continuar.");

  const token = await user.getIdToken();
  const response = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ tournamentId, region }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "No pudimos iniciar el pago. Intenta de nuevo.");
  }

  const data = (await response.json()) as { url?: string };
  if (!data.url) throw new Error("Stripe no devolvio una URL de pago.");

  window.location.assign(data.url);
}

export async function verifyCheckoutSession(sessionId: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;

  const token = await user.getIdToken();
  const response = await fetch("/api/verify-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ sessionId }),
  });

  if (!response.ok) return false;
  const data = (await response.json()) as { active?: boolean };
  return Boolean(data.active);
}
