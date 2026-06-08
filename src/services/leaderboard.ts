import type { LeagueMemberRecord } from "./members";
import type { LeagueRecord, Match, PredictionRecord } from "../types";
import { getInitials } from "../utils/initials";
import { calculateMatchPoints, type LeagueScoringConfig } from "../utils/scoring";

export type LeaderboardEntry = {
  id: string;
  name: string;
  initials: string;
  points: number;
  exacts: number;
  resultHits: number;
  joinedAt: string;
};

export function getScoredMatches(matches: Match[]): Match[] {
  return matches.filter(
    (match) =>
      match.status === "finished" &&
      match.homeScore !== undefined &&
      match.awayScore !== undefined,
  );
}

function buildPredictionIndex(predictions: PredictionRecord[]): Map<string, PredictionRecord> {
  const index = new Map<string, PredictionRecord>();
  predictions.forEach((prediction) => {
    index.set(`${prediction.userId}_${prediction.matchId}`, prediction);
  });
  return index;
}

export function computeLeaderboard(
  league: Pick<LeagueRecord, "scoringMode" | "resultPoints" | "exactBonus">,
  members: LeagueMemberRecord[],
  predictions: PredictionRecord[],
  finishedMatches: Match[],
): LeaderboardEntry[] {
  const config: LeagueScoringConfig = {
    scoringMode: league.scoringMode,
    resultPoints: league.resultPoints,
    exactBonus: league.exactBonus,
  };
  const predictionIndex = buildPredictionIndex(predictions);

  const entries = members.map((member) => {
    let points = 0;
    let exacts = 0;
    let resultHits = 0;

    finishedMatches.forEach((match) => {
      const prediction = predictionIndex.get(`${member.userId}_${match.id}`);
      if (!prediction) return;

      const outcome = calculateMatchPoints(
        config,
        { homeScore: prediction.homeScore, awayScore: prediction.awayScore },
        { homeScore: match.homeScore!, awayScore: match.awayScore! },
      );

      points += outcome.points;
      if (outcome.isExact) exacts += 1;
      if (outcome.isResultCorrect) resultHits += 1;
    });

    return {
      id: member.userId,
      name: member.displayName,
      initials: getInitials(member.displayName),
      points,
      exacts,
      resultHits,
      joinedAt: member.joinedAt,
    };
  });

  return entries.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.exacts !== a.exacts) return b.exacts - a.exacts;
    if (b.resultHits !== a.resultHits) return b.resultHits - a.resultHits;
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
  });
}
