export const ACTIVE_TOURNAMENT_ID = "world-cup-2026";

export type TournamentConfig = {
  id: string;
  name: string;
  shortName: string;
  endsAt: string;
  stripeProductName: string;
};

export const TOURNAMENTS: Record<string, TournamentConfig> = {
  "world-cup-2026": {
    id: "world-cup-2026",
    name: "Mundial FIFA 2026",
    shortName: "Mundial 2026",
    endsAt: "2026-07-20T00:00:00.000Z",
    stripeProductName: "Predicta Premium — Mundial 2026",
  },
};

export function getTournament(tournamentId: string): TournamentConfig {
  return TOURNAMENTS[tournamentId] ?? TOURNAMENTS[ACTIVE_TOURNAMENT_ID];
}
