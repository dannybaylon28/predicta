import type { Advancer, ScoringMode } from "../types";

// Bonus fijo (no configurable por liga) por acertar quien avanza cuando un
// partido de fase KO se define tras un empate en los 90' (tiempo extra o penales).
export const ADVANCE_BONUS_POINTS = 1;

export type ScoreLine = {
  homeScore: number;
  awayScore: number;
};

export type MatchPointsResult = {
  points: number;
  isExact: boolean;
  isResultCorrect: boolean;
};

export type AdvancePrediction = ScoreLine & {
  advancer?: Advancer;
};

export type KnockoutResult = ScoreLine & {
  decidedInExtraTime?: boolean;
  advancer?: Advancer;
};

export type DetailedMatchPoints = MatchPointsResult & {
  advanceBonus: number;
  advanceCorrect: boolean;
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

// El marcador (exacto/resultado) se evalua contra el marcador a los 90'.
// Si el partido se definio tras un empate (tiempo extra/penales) y el usuario
// predijo empate y acerto quien avanza, suma ADVANCE_BONUS_POINTS adicional.
export function calculateMatchPointsWithAdvance(
  config: LeagueScoringConfig,
  prediction: AdvancePrediction,
  result: KnockoutResult,
): DetailedMatchPoints {
  const base = calculateMatchPoints(
    config,
    { homeScore: prediction.homeScore, awayScore: prediction.awayScore },
    { homeScore: result.homeScore, awayScore: result.awayScore },
  );

  const predictedDraw = prediction.homeScore === prediction.awayScore;
  const advanceCorrect =
    Boolean(result.decidedInExtraTime) &&
    predictedDraw &&
    prediction.advancer != null &&
    result.advancer != null &&
    prediction.advancer === result.advancer;

  const advanceBonus = advanceCorrect ? ADVANCE_BONUS_POINTS : 0;

  return {
    ...base,
    points: base.points + advanceBonus,
    advanceBonus,
    advanceCorrect,
  };
}
