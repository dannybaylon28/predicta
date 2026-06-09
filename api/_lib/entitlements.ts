import { upsertFirestoreDocument } from "./firestore-rest.js";

type GrantEntitlementInput = {
  userId: string;
  tournamentId: string;
  currency: "mxn" | "usd";
  amount: number;
  stripeSessionId: string;
};

export async function grantEntitlement(input: GrantEntitlementInput): Promise<void> {
  const { userId, tournamentId, currency, amount, stripeSessionId } = input;

  await upsertFirestoreDocument(`users/${userId}/entitlements/${tournamentId}`, {
    tournamentId: { stringValue: tournamentId },
    status: { stringValue: "active" },
    purchasedAt: { timestampValue: new Date().toISOString() },
    currency: { stringValue: currency },
    amount: { integerValue: String(amount) },
    stripeSessionId: { stringValue: stripeSessionId },
  });
}
