import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin.js";

type GrantEntitlementInput = {
  userId: string;
  tournamentId: string;
  currency: "mxn" | "usd";
  amount: number;
  stripeSessionId: string;
};

export async function grantEntitlement(input: GrantEntitlementInput): Promise<void> {
  const { userId, tournamentId, currency, amount, stripeSessionId } = input;
  const ref = adminDb().doc(`users/${userId}/entitlements/${tournamentId}`);

  await ref.set(
    {
      tournamentId,
      status: "active",
      purchasedAt: FieldValue.serverTimestamp(),
      currency,
      amount,
      stripeSessionId,
    },
    { merge: true },
  );
}
