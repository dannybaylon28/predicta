import { useCallback, useEffect, useMemo, useState } from "react";
import { loadUserPredictions, saveUserPredictions, type PredictionDraft } from "../services/predictions";
import type { Match } from "../types";
import { getOpenMatches } from "../utils/matchStatus";
import { clampGoals } from "../utils/scores";

type ScoreDraft = Record<string, { homeScore: number; awayScore: number }>;

function buildInitialDraft(
  openMatches: Match[],
  saved: Record<string, { homeScore: number; awayScore: number }>,
): ScoreDraft {
  const draft: ScoreDraft = {};
  openMatches.forEach((match) => {
    const existing = saved[match.id];
    draft[match.id] = {
      homeScore: existing?.homeScore ?? 0,
      awayScore: existing?.awayScore ?? 0,
    };
  });
  return draft;
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
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const savedRecords = await loadUserPredictions(leagueId, userId);
      const saved: ScoreDraft = {};
      Object.values(savedRecords).forEach((record) => {
        saved[record.matchId] = {
          homeScore: record.homeScore,
          awayScore: record.awayScore,
        };
      });

      const nextDraft = buildInitialDraft(openMatches, saved);

      // Mezclar con el draft guardado en localStorage si existe para evitar perder cambios no guardados
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

      setSavedSnapshot(nextDraft);
      setDraft(mergedDraft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos cargar tus predicciones.");
      setDraft(buildInitialDraft(openMatches, {}));
      setSavedSnapshot({});
    } finally {
      setLoading(false);
    }
  }, [leagueId, openMatches, userId, cacheKey]);

  useEffect(() => {
    void load();
  }, [load]);

  // Guardar el borrador en localStorage de manera automatica conforme cambia
  useEffect(() => {
    if (!cacheKey || loading || saving) return;

    const changed: ScoreDraft = {};
    let hasDraftChanges = false;

    openMatches.forEach((match) => {
      const current = draft[match.id];
      const saved = savedSnapshot[match.id];
      if (current && saved && (current.homeScore !== saved.homeScore || current.awayScore !== saved.awayScore)) {
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

  const updateScore = useCallback((matchId: string, side: "homeScore" | "awayScore", value: number) => {
    setDraft((current) => ({
      ...current,
      [matchId]: {
        homeScore: side === "homeScore" ? clampGoals(value) : (current[matchId]?.homeScore ?? 0),
        awayScore: side === "awayScore" ? clampGoals(value) : (current[matchId]?.awayScore ?? 0),
      },
    }));
    setSuccess("");
  }, []);

  const changedMatchIds = useMemo(() => {
    return openMatches
      .filter((match) => {
        const current = draft[match.id];
        const saved = savedSnapshot[match.id];
        if (!current || !saved) return false;
        return current.homeScore !== saved.homeScore || current.awayScore !== saved.awayScore;
      })
      .map((match) => match.id);
  }, [draft, openMatches, savedSnapshot]);

  const hasChanges = changedMatchIds.length > 0;
  const pendingChangeCount = changedMatchIds.length;

  const saveAll = useCallback(async () => {
    if (!leagueId || !userId || !hasChanges) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const payloads: PredictionDraft[] = changedMatchIds
      .map((matchId) => {
        const scores = draft[matchId];
        if (!scores) return null;
        return {
          matchId,
          homeScore: scores.homeScore,
          awayScore: scores.awayScore,
        };
      })
      .filter((entry): entry is PredictionDraft => entry !== null);

    try {
      const savedCount = await saveUserPredictions(leagueId, userId, payloads, matchesById);
      setSavedSnapshot((current) => {
        const next = { ...current };
        changedMatchIds.forEach((matchId) => {
          if (draft[matchId]) {
            next[matchId] = { ...draft[matchId] };
          }
        });
        return next;
      });
      if (cacheKey) {
        localStorage.removeItem(cacheKey);
      }
      setSuccess(`Guardamos ${savedCount} prediccion${savedCount === 1 ? "" : "es"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos guardar tus predicciones.");
    } finally {
      setSaving(false);
    }
  }, [changedMatchIds, draft, hasChanges, leagueId, matchesById, userId, cacheKey]);

  return {
    openMatches,
    draft,
    loading,
    saving,
    error,
    success,
    hasChanges,
    pendingChangeCount,
    updateScore,
    saveAll,
    reload: load,
  };
}
