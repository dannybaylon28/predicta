import type { Advancer } from "../types";

// Capa de enriquecimiento para la fase KO usando football-data.org.
// Solo nos interesa el marcador al minuto 90 (regularTime), si el partido se
// definio tras un empate (tiempo extra / penales) y que equipo avanzo.

export type KoMatchEnrichment = {
  regulationHomeScore: number;
  regulationAwayScore: number;
  decidedInExtraTime: boolean;
  advancer?: Advancer;
};

type FootballDataScoreSide = {
  home: number | null;
  away: number | null;
};

type FootballDataScore = {
  winner?: string | null;
  duration?: string;
  fullTime?: FootballDataScoreSide;
  regularTime?: FootballDataScoreSide;
  extraTime?: FootballDataScoreSide;
  penalties?: FootballDataScoreSide;
};

type FootballDataMatch = {
  status?: string;
  stage?: string;
  homeTeam?: { name?: string | null };
  awayTeam?: { name?: string | null };
  score?: FootballDataScore;
};

type FootballDataResponse = {
  matches?: FootballDataMatch[];
};

const ENDPOINT = "/api/football-data";

const KO_STAGES = new Set([
  "LAST_32",
  "LAST_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "THIRD_PLACE",
  "FINAL",
]);

// Diferencias de nomenclatura conocidas entre football-data y worldcup26.
const TEAM_ALIASES: Record<string, string> = {
  "korea republic": "south korea",
  "ir iran": "iran",
  usa: "united states",
  "united states of america": "united states",
};

let cache: Map<string, KoMatchEnrichment> | null = null;

function normalizeTeam(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return TEAM_ALIASES[base] ?? base;
}

function pairKey(home: string, away: string): string {
  return `${normalizeTeam(home)}__${normalizeTeam(away)}`;
}

function isNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function deriveAdvancer(score: FootballDataScore): Advancer | undefined {
  if (score.winner === "HOME_TEAM") return "home";
  if (score.winner === "AWAY_TEAM") return "away";

  const penalties = score.penalties;
  if (penalties && isNumber(penalties.home) && isNumber(penalties.away) && penalties.home !== penalties.away) {
    return penalties.home > penalties.away ? "home" : "away";
  }

  // En algunos casos el desempate por penales solo se refleja en fullTime.
  const fullTime = score.fullTime;
  if (
    score.duration === "PENALTY_SHOOTOUT" &&
    fullTime &&
    isNumber(fullTime.home) &&
    isNumber(fullTime.away) &&
    fullTime.home !== fullTime.away
  ) {
    return fullTime.home > fullTime.away ? "home" : "away";
  }

  return undefined;
}

function toEnrichment(match: FootballDataMatch): KoMatchEnrichment | null {
  const score = match.score;
  if (!score) return null;

  // El marcador a los 90' es regularTime cuando hubo tiempo extra/penales;
  // si el partido se resolvio en tiempo reglamentario, regularTime no viene y
  // usamos fullTime (que ya es el marcador de los 90').
  const ninety =
    score.regularTime && isNumber(score.regularTime.home) && isNumber(score.regularTime.away)
      ? score.regularTime
      : score.fullTime;

  if (!ninety || !isNumber(ninety.home) || !isNumber(ninety.away)) return null;

  return {
    regulationHomeScore: ninety.home,
    regulationAwayScore: ninety.away,
    decidedInExtraTime: (score.duration ?? "REGULAR") !== "REGULAR",
    advancer: deriveAdvancer(score),
  };
}

function flip(enrichment: KoMatchEnrichment): KoMatchEnrichment {
  return {
    regulationHomeScore: enrichment.regulationAwayScore,
    regulationAwayScore: enrichment.regulationHomeScore,
    decidedInExtraTime: enrichment.decidedInExtraTime,
    advancer:
      enrichment.advancer === "home"
        ? "away"
        : enrichment.advancer === "away"
          ? "home"
          : undefined,
  };
}

export async function loadKoEnrichment(force = false): Promise<Map<string, KoMatchEnrichment>> {
  if (cache && !force) return cache;

  const map = new Map<string, KoMatchEnrichment>();

  try {
    const response = await fetch(ENDPOINT);
    if (!response.ok) {
      cache = map;
      return map;
    }

    const data = (await response.json()) as FootballDataResponse;
    const matches = data.matches ?? [];

    for (const match of matches) {
      if (!match.stage || !KO_STAGES.has(match.stage)) continue;
      if (match.status !== "FINISHED") continue;

      const home = match.homeTeam?.name;
      const away = match.awayTeam?.name;
      if (!home || !away) continue;

      const enrichment = toEnrichment(match);
      if (!enrichment) continue;

      // Guardamos en ambas orientaciones para emparejar sin importar el orden.
      map.set(pairKey(home, away), enrichment);
      map.set(pairKey(away, home), flip(enrichment));
    }
  } catch (error) {
    console.warn("No pudimos cargar el enriquecimiento KO de football-data:", error);
  }

  cache = map;
  return map;
}

export function getKoEnrichment(
  map: Map<string, KoMatchEnrichment>,
  homeTeamEn: string | undefined | null,
  awayTeamEn: string | undefined | null,
): KoMatchEnrichment | undefined {
  if (!homeTeamEn || !awayTeamEn) return undefined;
  return map.get(pairKey(homeTeamEn, awayTeamEn));
}
