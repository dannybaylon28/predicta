import { describe, expect, it } from "vitest";
import { calculateMatchPoints, getMatchOutcome, isExactScore, isResultCorrect } from "./scoring";

const hybridConfig = { scoringMode: "hybrid" as const, resultPoints: 3, exactBonus: 2 };
const resultConfig = { scoringMode: "result" as const, resultPoints: 3, exactBonus: 2 };
const exactConfig = { scoringMode: "exact" as const, resultPoints: 5, exactBonus: 2 };

describe("getMatchOutcome", () => {
  it("detecta ganador local, visitante y empate", () => {
    expect(getMatchOutcome(2, 1)).toBe("home");
    expect(getMatchOutcome(0, 1)).toBe("away");
    expect(getMatchOutcome(1, 1)).toBe("draw");
  });
});

describe("isResultCorrect", () => {
  it("acepta mismo ganador con marcador distinto", () => {
    expect(isResultCorrect({ homeScore: 2, awayScore: 1 }, { homeScore: 3, awayScore: 0 })).toBe(
      true,
    );
  });

  it("rechaza ganador incorrecto", () => {
    expect(isResultCorrect({ homeScore: 2, awayScore: 1 }, { homeScore: 0, awayScore: 1 })).toBe(
      false,
    );
  });
});

describe("isExactScore", () => {
  it("solo coincide con marcador identico", () => {
    expect(isExactScore({ homeScore: 2, awayScore: 1 }, { homeScore: 2, awayScore: 1 })).toBe(true);
    expect(isExactScore({ homeScore: 2, awayScore: 1 }, { homeScore: 3, awayScore: 1 })).toBe(
      false,
    );
  });
});

describe("calculateMatchPoints", () => {
  it("modo result suma solo por acertar ganador o empate", () => {
    const sameWinner = calculateMatchPoints(
      resultConfig,
      { homeScore: 2, awayScore: 1 },
      { homeScore: 4, awayScore: 0 },
    );
    expect(sameWinner).toEqual({ points: 3, isExact: false, isResultCorrect: true });

    const wrongWinner = calculateMatchPoints(
      resultConfig,
      { homeScore: 2, awayScore: 1 },
      { homeScore: 0, awayScore: 2 },
    );
    expect(wrongWinner.points).toBe(0);
  });

  it("modo exact solo suma con marcador exacto", () => {
    const exact = calculateMatchPoints(
      exactConfig,
      { homeScore: 1, awayScore: 1 },
      { homeScore: 1, awayScore: 1 },
    );
    expect(exact.points).toBe(5);

    const sameWinnerOnly = calculateMatchPoints(
      exactConfig,
      { homeScore: 2, awayScore: 0 },
      { homeScore: 5, awayScore: 1 },
    );
    expect(sameWinnerOnly.points).toBe(0);
  });

  it("modo hybrid suma resultado y bonus por exacto", () => {
    const exact = calculateMatchPoints(
      hybridConfig,
      { homeScore: 2, awayScore: 1 },
      { homeScore: 2, awayScore: 1 },
    );
    expect(exact).toEqual({ points: 5, isExact: true, isResultCorrect: true });

    const resultOnly = calculateMatchPoints(
      hybridConfig,
      { homeScore: 2, awayScore: 1 },
      { homeScore: 3, awayScore: 0 },
    );
    expect(resultOnly).toEqual({ points: 3, isExact: false, isResultCorrect: true });
  });
});
