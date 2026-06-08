import {
  Timestamp,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Match, PredictionRecord } from "../types";
import { isMatchOpen } from "../utils/matchStatus";
import { clampGoals } from "../utils/scores";

export type PredictionDraft = {
  matchId: string;
  homeScore: number;
  awayScore: number;
};

export function predictionDocId(userId: string, matchId: string): string {
  return `${userId}_${matchId}`;
}

export function mapPrediction(data: Record<string, unknown>): PredictionRecord {
  const kickoffAt =
    data.kickoffAt instanceof Timestamp
      ? data.kickoffAt.toDate().toISOString()
      : typeof data.kickoffAt === "string"
        ? data.kickoffAt
        : new Date().toISOString();

  return {
    userId: String(data.userId ?? ""),
    matchId: String(data.matchId ?? ""),
    homeScore: clampGoals(Number(data.homeScore ?? 0)),
    awayScore: clampGoals(Number(data.awayScore ?? 0)),
    kickoffAt,
  };
}

function filterByMatchIds(
  predictions: PredictionRecord[],
  matchIds: string[],
): PredictionRecord[] {
  if (matchIds.length === 0) return [];
  const matchIdSet = new Set(matchIds);
  return predictions.filter((prediction) => matchIdSet.has(prediction.matchId));
}

async function loadPredictionsForUser(
  leagueId: string,
  userId: string,
): Promise<PredictionRecord[]> {
  const snapshot = await getDocs(
    query(collection(db, "leagues", leagueId, "predictions"), where("userId", "==", userId)),
  );

  return snapshot.docs.map((entry) => mapPrediction(entry.data()));
}

export async function loadPredictionsForMembers(
  leagueId: string,
  userIds: string[],
  matchIds: string[],
): Promise<PredictionRecord[]> {
  if (userIds.length === 0 || matchIds.length === 0) return [];

  const batches = await Promise.all(
    userIds.map(async (userId) => {
      try {
        return await loadPredictionsForUser(leagueId, userId);
      } catch {
        return [];
      }
    }),
  );

  return filterByMatchIds(batches.flat(), matchIds);
}

export async function loadUserPredictions(
  leagueId: string,
  userId: string,
): Promise<Record<string, PredictionRecord>> {
  const snapshot = await getDocs(
    query(collection(db, "leagues", leagueId, "predictions"), where("userId", "==", userId)),
  );

  const predictions: Record<string, PredictionRecord> = {};
  snapshot.docs.forEach((entry) => {
    const mapped = mapPrediction(entry.data());
    predictions[mapped.matchId] = mapped;
  });

  return predictions;
}

export async function saveUserPredictions(
  leagueId: string,
  userId: string,
  drafts: PredictionDraft[],
  matchesById: Map<string, Match>,
): Promise<number> {
  if (drafts.length === 0) {
    throw new Error("No hay predicciones para guardar.");
  }

  const batch = writeBatch(db);
  const now = serverTimestamp();
  let savedCount = 0;

  drafts.forEach((draft) => {
    const match = matchesById.get(draft.matchId);
    if (!match) return;

    if (!isMatchOpen(match)) {
      throw new Error(`El partido ${match.home} vs ${match.away} ya cerro.`);
    }

    const homeScore = clampGoals(draft.homeScore);
    const awayScore = clampGoals(draft.awayScore);
    const ref = doc(db, "leagues", leagueId, "predictions", predictionDocId(userId, draft.matchId));

    batch.set(
      ref,
      {
        userId,
        matchId: draft.matchId,
        homeScore,
        awayScore,
        kickoffAt: Timestamp.fromDate(new Date(match.kickoffAt)),
        updatedAt: now,
      },
      { merge: true },
    );

    savedCount += 1;
  });

  if (savedCount === 0) {
    throw new Error("No hay partidos abiertos para guardar.");
  }

  await batch.commit();
  return savedCount;
}
