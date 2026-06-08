import type { Match } from "../types";

export function isMatchOpen(match: Match): boolean {
  return !match.locked && match.status !== "finished";
}

export function sortMatchesByKickoff(matches: Match[]): Match[] {
  return [...matches].sort(
    (a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime(),
  );
}

export function getOpenMatches(matches: Match[]): Match[] {
  return sortMatchesByKickoff(matches.filter(isMatchOpen));
}

export function getFinishedMatches(matches: Match[]): Match[] {
  return sortMatchesByKickoff(
    matches.filter(
      (match) =>
        match.status === "finished" &&
        match.homeScore !== undefined &&
        match.awayScore !== undefined,
    ),
  );
}
