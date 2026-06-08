import type { Match } from "../types";

export type MatchStatusVariant = "open" | "live" | "finished";

export type MatchStatusDisplay = {
  label: string;
  variant: MatchStatusVariant;
  countdown: string | null;
};

const COUNTDOWN_WINDOW_MS = 48 * 60 * 60 * 1000;

export function formatKickoffCountdown(kickoffAt: string, now = Date.now()): string | null {
  const diff = new Date(kickoffAt).getTime() - now;
  if (diff <= 0 || diff > COUNTDOWN_WINDOW_MS) return null;

  const hours = Math.floor(diff / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

  if (hours > 0) return `Cierra en ${hours}h ${minutes}m`;
  if (minutes > 0) return `Cierra en ${minutes}m`;
  return "Cierra en menos de 1m";
}

export function getMatchStatusDisplay(match: Match, now = Date.now()): MatchStatusDisplay {
  if (match.status === "finished") {
    return { label: "Final", variant: "finished", countdown: null };
  }

  if (match.status === "live") {
    return { label: "En juego", variant: "live", countdown: null };
  }

  return {
    label: "Abierto",
    variant: "open",
    countdown: formatKickoffCountdown(match.kickoffAt, now),
  };
}
