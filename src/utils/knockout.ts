import type { MatchStage } from "../types";

const KNOCKOUT_STAGES: ReadonlySet<MatchStage> = new Set([
  "r32",
  "r16",
  "qf",
  "sf",
  "third",
  "final",
]);

export function isKnockoutStage(stage: MatchStage): boolean {
  return KNOCKOUT_STAGES.has(stage);
}
