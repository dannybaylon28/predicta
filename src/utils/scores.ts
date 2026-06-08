export const MIN_GOALS = 0;
export const MAX_GOALS = 15;

export function clampGoals(value: number): number {
  if (!Number.isFinite(value)) return MIN_GOALS;
  return Math.min(MAX_GOALS, Math.max(MIN_GOALS, Math.trunc(value)));
}

export function parseGoalsInput(raw: string): number {
  if (raw.trim() === "") return MIN_GOALS;
  return clampGoals(Number(raw));
}
