import { useCallback, useEffect, useMemo, useState } from "react";
import { useMatches } from "../context/MatchesContext";
import { computeLeaderboard, getScoredMatches, type LeaderboardEntry } from "../services/leaderboard";
import { listLeagueMembers, type LeagueMemberRecord } from "../services/members";
import { loadPredictionsForMembers } from "../services/predictions";
import type { LeagueRecord, PredictionRecord } from "../types";

export function useLeaderboard(league: LeagueRecord | null) {
  const { matches, loading: matchesLoading } = useMatches();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [members, setMembers] = useState<LeagueMemberRecord[]>([]);
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const finishedMatches = useMemo(() => getScoredMatches(matches), [matches]);

  const load = useCallback(async () => {
    if (!league || matchesLoading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const nextMembers = await listLeagueMembers(league.id);
      const matchIds = finishedMatches.map((match) => match.id);
      const preds = await loadPredictionsForMembers(
        league.id,
        nextMembers.map((member) => member.userId),
        matchIds,
      );

      setMembers(nextMembers);
      setPredictions(preds);
      setEntries(computeLeaderboard(league, nextMembers, preds, finishedMatches));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos cargar la clasificacion.");
      setEntries([]);
      setMembers([]);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  }, [finishedMatches, league, matchesLoading]);

  useEffect(() => {
    if (!league) {
      setEntries([]);
      setMembers([]);
      setPredictions([]);
      setLoading(false);
      setError("");
      return;
    }

    if (matchesLoading) {
      setLoading(true);
      return;
    }

    void load();
  }, [league, load, matchesLoading]);

  return {
    entries,
    members,
    predictions,
    finishedMatches,
    finishedMatchCount: finishedMatches.length,
    loading: matchesLoading || loading,
    error,
    reload: load,
  };
};
