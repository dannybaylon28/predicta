import { doc, getDoc, onSnapshot, setDoc, type Unsubscribe } from "firebase/firestore";
import { db } from "../firebase";
import type { LeagueRecord, TournamentEntitlement, TournamentUsage } from "../types";
import { DEFAULT_TOURNAMENT_ID } from "../constants/plan";
import { getTournament } from "../constants/tournaments";

type EntitlementDoc = {
  tournamentId: string;
  status: "active" | "expired";
  purchasedAt: { toDate?: () => Date } | string;
  currency: "mxn" | "usd";
  amount: number;
  stripeSessionId?: string;
};

type UsageDoc = {
  tournamentId: string;
  leaguesCreated: number;
};

function mapEntitlement(tournamentId: string, data: EntitlementDoc): TournamentEntitlement {
  const purchasedAt =
    typeof data.purchasedAt === "string"
      ? data.purchasedAt
      : data.purchasedAt?.toDate?.().toISOString() ?? new Date().toISOString();

  return {
    tournamentId,
    status: data.status,
    purchasedAt,
    currency: data.currency,
    amount: data.amount,
    stripeSessionId: data.stripeSessionId,
  };
}

export async function getEntitlement(
  userId: string,
  tournamentId = DEFAULT_TOURNAMENT_ID,
): Promise<TournamentEntitlement | null> {
  const snap = await getDoc(doc(db, "users", userId, "entitlements", tournamentId));
  if (!snap.exists()) return null;
  return mapEntitlement(tournamentId, snap.data() as EntitlementDoc);
}

export function isEntitlementActive(entitlement: TournamentEntitlement | null): boolean {
  if (!entitlement || entitlement.status !== "active") return false;

  const tournament = getTournament(entitlement.tournamentId);
  return new Date() < new Date(tournament.endsAt);
}

export async function hasPremium(
  userId: string,
  tournamentId = DEFAULT_TOURNAMENT_ID,
): Promise<boolean> {
  const entitlement = await getEntitlement(userId, tournamentId);
  return isEntitlementActive(entitlement);
}

export async function getTournamentUsage(
  userId: string,
  tournamentId = DEFAULT_TOURNAMENT_ID,
): Promise<TournamentUsage> {
  const snap = await getDoc(doc(db, "users", userId, "tournamentUsage", tournamentId));
  if (!snap.exists()) {
    return { tournamentId, leaguesCreated: 0 };
  }

  const data = snap.data() as UsageDoc;
  return {
    tournamentId,
    leaguesCreated: data.leaguesCreated ?? 0,
  };
}

export function countAdminLeagues(
  leagues: LeagueRecord[],
  userId: string,
  tournamentId = DEFAULT_TOURNAMENT_ID,
): number {
  return leagues.filter(
    (league) => league.adminId === userId && league.tournamentId === tournamentId,
  ).length;
}

export function subscribeEntitlement(
  userId: string,
  tournamentId: string,
  onChange: (entitlement: TournamentEntitlement | null) => void,
): Unsubscribe {
  return onSnapshot(doc(db, "users", userId, "entitlements", tournamentId), (snap) => {
    if (!snap.exists()) {
      onChange(null);
      return;
    }
    onChange(mapEntitlement(tournamentId, snap.data() as EntitlementDoc));
  });
}

export async function ensureTournamentUsageDoc(
  userId: string,
  tournamentId = DEFAULT_TOURNAMENT_ID,
): Promise<void> {
  const ref = doc(db, "users", userId, "tournamentUsage", tournamentId);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  await setDoc(ref, {
    tournamentId,
    leaguesCreated: 0,
  });
}
