import { useCallback, useEffect, useMemo, useState } from "react";
import { useMatches } from "../context/MatchesContext";
import { computeLeaderboard, getScoredMatches, type LeaderboardEntry } from "../services/leaderboard";
import { listLeagueMembers } from "../services/members";
import { loadPredictionsForMembers } from "../services/predictions";
import type { LeagueRecord } from "../types";

export function useLeaderboard(league: LeagueRecord | null) {
  const { matches } = useMatches();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const finishedMatches = useMemo(() => getScoredMatches(matches), [matches]);

  const load = useCallback(async () => {
    if (!league) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const members = await listLeagueMembers(league.id);
      const matchIds = finishedMatches.map((match) => match.id);
      const predictions = await loadPredictionsForMembers(
        league.id,
        members.map((member) => member.userId),
        matchIds,
      );

      setEntries(computeLeaderboard(league, members, predictions, finishedMatches));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos cargar la clasificacion.");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [finishedMatches, league]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    entries,
    finishedMatchCount: finishedMatches.length,
    loading,
    error,
    reload: load,
  };
}
