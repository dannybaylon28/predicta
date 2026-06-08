import type { Member, Prediction } from "../types";

export const predictions: Prediction[] = [];

export const leaderboard: Member[] = [
  { id: "1", name: "Ana Sofia", initials: "AS", points: 42, exacts: 7, trend: "up" },
  { id: "2", name: "Daniel", initials: "DB", points: 38, exacts: 5, trend: "stable" },
  { id: "3", name: "Rafa", initials: "RF", points: 35, exacts: 4, trend: "up" },
  { id: "4", name: "Majo", initials: "MJ", points: 31, exacts: 3, trend: "down" },
  { id: "5", name: "Luis", initials: "LG", points: 28, exacts: 2, trend: "stable" },
];
