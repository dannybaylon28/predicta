export const ACTIVE_TOURNAMENT_ID = "world-cup-2026";

export const TOURNAMENT_CATALOG: Record<
  string,
  { name: string; stripeProductName: string; endsAt: string }
> = {
  "world-cup-2026": {
    name: "Mundial FIFA 2026",
    stripeProductName: "Predicta Premium — Mundial 2026",
    endsAt: "2026-07-20T00:00:00.000Z",
  },
};

export function getTournamentConfig(tournamentId: string) {
  return TOURNAMENT_CATALOG[tournamentId] ?? TOURNAMENT_CATALOG[ACTIVE_TOURNAMENT_ID];
}
