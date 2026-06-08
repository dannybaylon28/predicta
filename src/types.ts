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
};

export type PredictionRecord = {
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
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
