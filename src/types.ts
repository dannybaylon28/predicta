export type ScoringMode = "result" | "exact" | "hybrid";

export type MatchStage =
  | "group"
  | "r32"
  | "r16"
  | "qf"
  | "sf"
  | "third"
  | "final";

export type MatchStatus = "scheduled" | "live" | "finished";

export type Advancer = "home" | "away";

export type Match = {
  id: string;
  group: string;
  matchday: string;
  date: string;
  kickoffAt: string;
  venue: string;
  home: string;
  away: string;
  homeScore?: number;
  awayScore?: number;
  locked: boolean;
  status: MatchStatus;
  stage: MatchStage;
  // Enriquecimiento de fase KO (football-data.org):
  // marcador al minuto 90 (sin tiempo extra ni penales).
  regulationHomeScore?: number;
  regulationAwayScore?: number;
  // Se definio tras un empate en los 90' (tiempo extra o penales).
  decidedInExtraTime?: boolean;
  // Equipo que avanzo a la siguiente ronda.
  advancer?: Advancer;
};

export type LeagueRecord = {
  id: string;
  name: string;
  prize: string;
  winners: number;
  scoringMode: ScoringMode;
  resultPoints: number;
  exactBonus: number;
  members: number;
  adminId: string;
  adminName: string;
  inviteCode: string;
  tournamentId: string;
  status: "draft" | "active" | "finished";
};

export type Prediction = {
  matchId: string;
  homeScore: number;
  awayScore: number;
  advancer?: Advancer;
};

export type PredictionRecord = {
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  advancer?: Advancer;
  kickoffAt: string;
  updatedAt?: string;
};

export type Member = {
  id: string;
  name: string;
  initials: string;
  points: number;
  exacts: number;
  trend: "up" | "down" | "stable";
};

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
};

export type TournamentEntitlement = {
  tournamentId: string;
  status: "active" | "expired";
  purchasedAt: string;
  currency: "mxn" | "usd";
  amount: number;
  stripeSessionId?: string;
};

export type TournamentUsage = {
  tournamentId: string;
  leaguesCreated: number;
};
