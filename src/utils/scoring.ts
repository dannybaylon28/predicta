import type { ScoringMode } from "../types";

export type ScoreLine = {
  homeScore: number;
  awayScore: number;
};

export type MatchPointsResult = {
  points: number;
  isExact: boolean;
  isResultCorrect: boolean;
};

export type LeagueScoringConfig = {
  scoringMode: ScoringMode;
  resultPoints: number;
  exactBonus: number;
};

export type MatchOutcome = "home" | "away" | "draw";

export function getMatchOutcome(homeScore: number, awayScore: number): MatchOutcome {
  if (homeScore > awayScore) return "home";
  if (homeScore < awayScore) return "away";
  return "draw";
}

export function isExactScore(prediction: ScoreLine, result: ScoreLine): boolean {
  return prediction.homeScore === result.homeScore && prediction.awayScore === result.awayScore;
}

export function isResultCorrect(prediction: ScoreLine, result: ScoreLine): boolean {
  return getMatchOutcome(prediction.homeScore, prediction.awayScore) === getMatchOutcome(
    result.homeScore,
    result.awayScore,
  );
}

export function calculateMatchPoints(
  config: LeagueScoringConfig,
  prediction: ScoreLine,
  result: ScoreLine,
): MatchPointsResult {
  const exact = isExactScore(prediction, result);
  const resultCorrect = isResultCorrect(prediction, result);

  switch (config.scoringMode) {
    case "result":
      return {
        points: resultCorrect ? config.resultPoints : 0,
        isExact: exact,
        isResultCorrect: resultCorrect,
      };
    case "exact":
      return {
        points: exact ? config.resultPoints : 0,
        isExact: exact,
        isResultCorrect: resultCorrect,
      };
    case "hybrid": {
      let points = 0;
      if (resultCorrect) points += config.resultPoints;
      if (exact) points += config.exactBonus;
      return { points, isExact: exact, isResultCorrect: resultCorrect };
    }
  }
}
