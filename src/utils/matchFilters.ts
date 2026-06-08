import type { Match, MatchStage } from "../types";
import { sortMatchesByKickoff } from "./matchStatus";

export const ALL_MATCHDAYS_KEY = "all";

const MATCHDAY_LABELS: Record<string, string> = {
  "1": "Jornada 1",
  "2": "Jornada 2",
  "3": "Jornada 3",
  "4": "Dieciseisavos",
  "5": "Octavos",
  "6": "Cuartos",
  "7": "Semifinales",
  "8": "Tercer lugar",
  "9": "Final",
};

const STAGE_LABELS: Record<MatchStage, string> = {
  group: "Fase de grupos",
  r32: "Dieciseisavos",
  r16: "Octavos",
  qf: "Cuartos",
  sf: "Semifinales",
  third: "Tercer lugar",
  final: "Final",
};

export type MatchdayOption = {
  key: string;
  label: string;
  count: number;
  dateLabel: string;
};

export type MatchDayGroup = {
  key: string;
  label: string;
  matches: Match[];
};

function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatDateRange(matches: Match[]): string {
  if (matches.length === 0) return "";

  const times = matches.map((match) => new Date(match.kickoffAt).getTime());
  const min = new Date(Math.min(...times));
  const max = new Date(Math.max(...times));
  const dayFmt = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" });

  if (min.toDateString() === max.toDateString()) {
    return dayFmt.format(min);
  }

  return `${dayFmt.format(min)} – ${dayFmt.format(max)}`;
}

function matchdayLabel(matchday: string, stage: MatchStage): string {
  return MATCHDAY_LABELS[matchday] ?? STAGE_LABELS[stage] ?? `Jornada ${matchday}`;
}

export function buildMatchdayOptions(matches: Match[]): MatchdayOption[] {
  const sorted = sortMatchesByKickoff(matches);
  const groups = new Map<string, Match[]>();

  sorted.forEach((match) => {
    const bucket = groups.get(match.matchday) ?? [];
    bucket.push(match);
    groups.set(match.matchday, bucket);
  });

  const options = [...groups.entries()]
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([matchday, bucket]) => ({
      key: matchday,
      label: matchdayLabel(matchday, bucket[0].stage),
      count: bucket.length,
      dateLabel: formatDateRange(bucket),
    }));

  if (options.length > 1) {
    options.push({
      key: ALL_MATCHDAYS_KEY,
      label: "Todos",
      count: sorted.length,
      dateLabel: formatDateRange(sorted),
    });
  }

  return options;
}

export function getNearestOpenMatch(matches: Match[], now = Date.now()): Match | null {
  if (matches.length === 0) return null;

  const sorted = sortMatchesByKickoff(matches);
  const upcoming = sorted.find((match) => new Date(match.kickoffAt).getTime() >= now);
  return upcoming ?? sorted[sorted.length - 1];
}

export function getDefaultMatchdayKey(matches: Match[], now = Date.now()): string {
  const nearest = getNearestOpenMatch(matches, now);
  return nearest?.matchday ?? ALL_MATCHDAYS_KEY;
}

export function filterMatchesByMatchday(matches: Match[], matchdayKey: string): Match[] {
  if (matchdayKey === ALL_MATCHDAYS_KEY) {
    return sortMatchesByKickoff(matches);
  }

  return sortMatchesByKickoff(matches.filter((match) => match.matchday === matchdayKey));
}

export function groupMatchesByCalendarDay(matches: Match[]): MatchDayGroup[] {
  const sorted = sortMatchesByKickoff(matches);
  const groups = new Map<string, Match[]>();

  sorted.forEach((match) => {
    const day = new Date(match.kickoffAt);
    const key = [
      day.getFullYear(),
      String(day.getMonth() + 1).padStart(2, "0"),
      String(day.getDate()).padStart(2, "0"),
    ].join("-");
    const bucket = groups.get(key) ?? [];
    bucket.push(match);
    groups.set(key, bucket);
  });

  return [...groups.entries()].map(([key, bucket]) => ({
    key,
    label: formatShortDate(new Date(bucket[0].kickoffAt)),
    matches: bucket,
  }));
}
