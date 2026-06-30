import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteUserPredictions,
  isCompleteScorePair,
  isEmptyScorePair,
  loadUserPredictions,
  saveUserPredictions,
  type PredictionDraft,
  type ScorePair,
} from "../services/predictions";
import type { Advancer, Match } from "../types";
import { getOpenMatches } from "../utils/matchStatus";

type ScoreDraft = Record<string, ScorePair>;

function samePair(a: ScorePair, b: ScorePair): boolean {
  return (
    a.homeScore === b.homeScore &&
    a.awayScore === b.awayScore &&
    (a.advancer ?? null) === (b.advancer ?? null)
  );
}

type PendingChange =
  | { matchId: string; type: "save" }
  | { matchId: string; type: "delete" }
  | { matchId: string; type: "partial" };

function buildInitialDraft(
  openMatches: Match[],
  saved: Record<string, ScorePair>,
): ScoreDraft {
  const draft: ScoreDraft = {};
  openMatches.forEach((match) => {
    const existing = saved[match.id];
    draft[match.id] = {
      homeScore: existing?.homeScore ?? null,
      awayScore: existing?.awayScore ?? null,
      advancer: existing?.advancer ?? null,
    };
  });
  return draft;
}

function getPendingChanges(
  openMatches: Match[],
  draft: ScoreDraft,
  savedSnapshot: ScoreDraft,
  savedPredictionIds: Set<string>,
): PendingChange[] {
  const changes: PendingChange[] = [];

  openMatches.forEach((match) => {
    const current = draft[match.id] ?? { homeScore: null, awayScore: null };
    const saved = savedSnapshot[match.id] ?? { homeScore: null, awayScore: null };

    if (samePair(current, saved)) {
      return;
    }

    if (isCompleteScorePair(current)) {
      changes.push({ matchId: match.id, type: "save" });
      return;
    }

    if (isEmptyScorePair(current)) {
      if (savedPredictionIds.has(match.id)) {
        changes.push({ matchId: match.id, type: "delete" });
      }
      return;
    }

    changes.push({ matchId: match.id, type: "partial" });
  });

  return changes;
}

export function usePredictions(
  leagueId: string | null,
  userId: string | undefined,
  matches: Match[],
) {
  const openMatches = useMemo(() => getOpenMatches(matches), [matches]);
  const matchesById = useMemo(() => new Map(matches.map((match) => [match.id, match])), [matches]);

  const [draft, setDraft] = useState<ScoreDraft>({});
  const [savedSnapshot, setSavedSnapshot] = useState<ScoreDraft>({});
  const [savedPredictions, setSavedPredictions] = useState<Record<string, ScorePair>>({});
  const [savedPredictionIds, setSavedPredictionIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const cacheKey = useMemo(() => {
    return leagueId && userId ? `predicta_draft_${userId}_${leagueId}` : null;
  }, [leagueId, userId]);

  const load = useCallback(async () => {
    if (!leagueId || !userId) {
      setDraft({});
      setSavedSnapshot({});
      setSavedPredictions({});
      setSavedPredictionIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const savedRecords = await loadUserPredictions(leagueId, userId);
      const saved: Record<string, ScorePair> = {};
      Object.values(savedRecords).forEach((record) => {
        saved[record.matchId] = {
          homeScore: record.homeScore,
          awayScore: record.awayScore,
          advancer: record.advancer ?? null,
        };
      });

      const nextDraft = buildInitialDraft(openMatches, saved);

      let mergedDraft = { ...nextDraft };
      if (cacheKey) {
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) {
          try {
            const cached = JSON.parse(cachedStr) as ScoreDraft;
            Object.keys(cached).forEach((matchId) => {
              if (cached[matchId] && mergedDraft[matchId]) {
                mergedDraft[matchId] = cached[matchId];
              }
            });
          } catch (e) {
            console.warn("Error al restaurar el borrador local:", e);
          }
        }
      }

      const savedPairs: Record<string, ScorePair> = {};
      Object.entries(saved).forEach(([matchId, scores]) => {
        savedPairs[matchId] = { ...scores };
      });

      setSavedPredictionIds(new Set(Object.keys(saved)));
      setSavedPredictions(savedPairs);
      setSavedSnapshot(nextDraft);
      setDraft(mergedDraft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos cargar tus predicciones.");
      setDraft(buildInitialDraft(openMatches, {}));
      setSavedSnapshot({});
      setSavedPredictions({});
      setSavedPredictionIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [leagueId, openMatches, userId, cacheKey]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!cacheKey || loading || saving) return;

    const changed: ScoreDraft = {};
    let hasDraftChanges = false;

    openMatches.forEach((match) => {
      const current = draft[match.id];
      const saved = savedSnapshot[match.id];
      if (current && saved && !samePair(current, saved)) {
        changed[match.id] = current;
        hasDraftChanges = true;
      }
    });

    if (hasDraftChanges) {
      localStorage.setItem(cacheKey, JSON.stringify(changed));
    } else {
      localStorage.removeItem(cacheKey);
    }
  }, [draft, savedSnapshot, openMatches, cacheKey, loading, saving]);

  const updateScore = useCallback(
    (matchId: string, side: "homeScore" | "awayScore", value: number | null) => {
      setDraft((current) => {
        const existing = current[matchId] ?? { homeScore: null, awayScore: null };
        const homeScore = side === "homeScore" ? value : (existing.homeScore ?? null);
        const awayScore = side === "awayScore" ? value : (existing.awayScore ?? null);
        const isDraw = homeScore !== null && awayScore !== null && homeScore === awayScore;

        return {
          ...current,
          [matchId]: {
            homeScore,
            awayScore,
            // El "quien avanza" solo tiene sentido con empate; si deja de serlo, se limpia.
            advancer: isDraw ? (existing.advancer ?? null) : null,
          },
        };
      });
      setSuccess("");
    },
    [],
  );

  const updateAdvancer = useCallback((matchId: string, advancer: Advancer | null) => {
    setDraft((current) => {
      const existing = current[matchId] ?? { homeScore: null, awayScore: null };
      return {
        ...current,
        [matchId]: { ...existing, advancer },
      };
    });
    setSuccess("");
  }, []);

  const pendingChanges = useMemo(
    () => getPendingChanges(openMatches, draft, savedSnapshot, savedPredictionIds),
    [draft, openMatches, savedPredictionIds, savedSnapshot],
  );

  const actionableChanges = useMemo(
    () => pendingChanges.filter((change) => change.type !== "partial"),
    [pendingChanges],
  );

  const pendingChangeByMatchId = useMemo(() => {
    const map = new Map<string, PendingChange["type"]>();
    pendingChanges.forEach((change) => {
      map.set(change.matchId, change.type);
    });
    return map;
  }, [pendingChanges]);

  const partialChangeCount = pendingChanges.filter((change) => change.type === "partial").length;
  const hasChanges = actionableChanges.length > 0;
  const pendingChangeCount = actionableChanges.length;

  const saveAll = useCallback(async () => {
    if (!leagueId || !userId || !hasChanges) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const toSave: PredictionDraft[] = actionableChanges
      .filter((change): change is { matchId: string; type: "save" } => change.type === "save")
      .map((change): PredictionDraft | null => {
        const scores = draft[change.matchId];
        if (!scores || !isCompleteScorePair(scores)) return null;
        return {
          matchId: change.matchId,
          homeScore: scores.homeScore,
          awayScore: scores.awayScore,
          advancer: scores.advancer ?? null,
        };
      })
      .filter((entry): entry is PredictionDraft => entry !== null);

    const toDelete = actionableChanges
      .filter((change): change is { matchId: string; type: "delete" } => change.type === "delete")
      .map((change) => change.matchId);

    try {
      const savedCount =
        toSave.length > 0 ? await saveUserPredictions(leagueId, userId, toSave, matchesById) : 0;
      const deletedCount =
        toDelete.length > 0 ? await deleteUserPredictions(leagueId, userId, toDelete) : 0;

      const touchedIds = [...toSave.map((entry) => entry.matchId), ...toDelete];

      setSavedSnapshot((current) => {
        const next = { ...current };
        toSave.forEach((entry) => {
          const scores = draft[entry.matchId];
          if (scores) next[entry.matchId] = { ...scores };
        });
        toDelete.forEach((matchId) => {
          next[matchId] = { homeScore: null, awayScore: null, advancer: null };
        });
        return next;
      });

      setSavedPredictions((current) => {
        const next = { ...current };
        toSave.forEach((entry) => {
          const scores = draft[entry.matchId];
          if (scores && isCompleteScorePair(scores)) {
            next[entry.matchId] = { ...scores };
          }
        });
        toDelete.forEach((matchId) => {
          delete next[matchId];
        });
        return next;
      });

      setSavedPredictionIds((current) => {
        const next = new Set(current);
        toSave.forEach((entry) => next.add(entry.matchId));
        toDelete.forEach((matchId) => next.delete(matchId));
        return next;
      });

      if (cacheKey) {
        localStorage.removeItem(cacheKey);
      }

      const messages: string[] = [];
      if (savedCount > 0) {
        messages.push(
          `Guardamos ${savedCount} prediccion${savedCount === 1 ? "" : "es"}`,
        );
      }
      if (deletedCount > 0) {
        messages.push(
          `Eliminamos ${deletedCount} prediccion${deletedCount === 1 ? "" : "es"}`,
        );
      }
      if (partialChangeCount > 0) {
        messages.push(
          `${partialChangeCount} partido${partialChangeCount === 1 ? "" : "s"} quedaron con marcador incompleto`,
        );
      }

      setSuccess(messages.join(". ") + ".");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos guardar tus predicciones.");
    } finally {
      setSaving(false);
    }
  }, [
    actionableChanges,
    cacheKey,
    draft,
    hasChanges,
    leagueId,
    matchesById,
    partialChangeCount,
    userId,
  ]);

  return {
    openMatches,
    draft,
    savedPredictions,
    loading,
    saving,
    error,
    success,
    hasChanges,
    pendingChangeCount,
    partialChangeCount,
    pendingChangeByMatchId,
    updateScore,
    updateAdvancer,
    saveAll,
    reload: load,
  };
};
