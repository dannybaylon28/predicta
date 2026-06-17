import type { Match, MatchStage, MatchStatus } from "../types";
import type { ApiGame, ApiStadium } from "../types/worldcup";
import { toSpanishTeamName } from "../utils/teamNames";

type GamesResponse = { games: ApiGame[] };
type StadiumsResponse = { stadiums: ApiStadium[] };

const LOCAL_GAMES_URL = "/data/worldcup-games.json";
const LOCAL_STADIUMS_URL = "/data/worldcup-stadiums.json";

let cachedMatches: Match[] | null = null;

function remoteBaseUrl(): string {
  // Mismo origen en dev (proxy Vite) y prod (rewrite Vercel) para evitar CORS.
  return "/api/worldcup";
}

function parseKickoff(localDate: string): Date {
  const [datePart, timePart] = localDate.split(" ");
  const [month, day, year] = datePart.split("/").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

function formatDisplayDate(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function mapStage(type: string): MatchStage {
  const stages: Record<string, MatchStage> = {
    group: "group",
    r32: "r32",
    r16: "r16",
    qf: "qf",
    sf: "sf",
    third: "third",
    final: "final",
  };
  return stages[type] ?? "group";
}

function mapStatus(game: ApiGame, kickoff: Date): MatchStatus {
  if (game.finished === "TRUE") return "finished";
  if (game.time_elapsed !== "notstarted") return "live";
  if (Date.now() >= kickoff.getTime()) return "live";
  return "scheduled";
}

function mapGroupLabel(group: string, stage: MatchStage): string {
  if (stage === "group") return `Grupo ${group}`;
  if (stage === "r32") return "Dieciseisavos";
  if (stage === "r16") return "Octavos";
  if (stage === "qf") return "Cuartos";
  if (stage === "sf") return "Semifinal";
  if (stage === "third") return "Tercer lugar";
  if (stage === "final") return "Final";
  return group;
}

function mapGame(game: ApiGame, stadiums: Map<string, ApiStadium>): Match {
  const kickoff = parseKickoff(game.local_date);
  const stadium = stadiums.get(game.stadium_id);
  const stage = mapStage(game.type);
  const status = mapStatus(game, kickoff);
  const home = toSpanishTeamName(game.home_team_name_en ?? game.home_team_label ?? "Por definir");
  const away = toSpanishTeamName(game.away_team_name_en ?? game.away_team_label ?? "Por definir");
  const homeScore = Number(game.home_score);
  const awayScore = Number(game.away_score);

  return {
    id: game.id,
    group: mapGroupLabel(game.group, stage),
    matchday: game.matchday,
    date: formatDisplayDate(kickoff),
    kickoffAt: kickoff.toISOString(),
    venue: stadium?.fifa_name ?? stadium?.name_en ?? "Por confirmar",
    home,
    away,
    homeScore: Number.isFinite(homeScore) ? homeScore : undefined,
    awayScore: Number.isFinite(awayScore) ? awayScore : undefined,
    locked: status !== "scheduled",
    status,
    stage,
  };
}

function useLocalMatchesInDev(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_MATCHES === "true";
}

async function fetchJsonWithFallback<T>(remotePath: string, localPath: string): Promise<T> {
  const cacheKey = `worldcup_cache_${remotePath.replace(/\//g, "_")}`;

  if (useLocalMatchesInDev()) {
    const fallback = await fetch(localPath);
    if (!fallback.ok) {
      throw new Error(
        "No pudimos cargar el calendario local del Mundial. Revisa public/data e intenta de nuevo.",
      );
    }
    return (await fallback.json()) as T;
  }

  // Intenta obtener los datos frescos de la API remota
  try {
    const response = await fetch(`${remoteBaseUrl()}${remotePath}`);
    if (response.ok) {
      const data = await response.json();
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (e) {
          console.warn("No se pudo guardar en la cache local de localStorage:", e);
        }
      }
      return data as T;
    }
    console.warn(`La API remota devolvio un estado de error ${response.status} para ${remotePath}. Intentando usar cache o fallback local.`);
  } catch (error) {
    console.warn(`Fallo la conexion con la API remota para ${remotePath}. Intentando usar cache o fallback local.`, error);
  }

  // Primer Fallback: Intentar obtener la version cacheada previamente en localStorage
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as T;
      } catch (e) {
        console.warn("Error al deserializar la cache de localStorage:", e);
      }
    }
  }

  // Segundo Fallback: Intentar obtener el archivo local (estatico) de respaldo
  try {
    const fallback = await fetch(localPath);
    if (fallback.ok) {
      return (await fallback.json()) as T;
    }
  } catch (error) {
    console.error(`Fallo tambien el fallback local para ${localPath}:`, error);
  }

  throw new Error(
    "No pudimos cargar el calendario del Mundial. Revisa tu conexion e intenta de nuevo.",
  );
}

async function fetchStadiumMap(): Promise<Map<string, ApiStadium>> {
  const data = await fetchJsonWithFallback<StadiumsResponse>("/stadiums", LOCAL_STADIUMS_URL);
  return new Map(data.stadiums.map((stadium) => [stadium.id, stadium]));
}

export async function fetchWorldCupMatches(force = false): Promise<Match[]> {
  if (cachedMatches && !force) return cachedMatches;

  const [gamesData, stadiums] = await Promise.all([
    fetchJsonWithFallback<GamesResponse>("/games", LOCAL_GAMES_URL),
    fetchStadiumMap(),
  ]);

  cachedMatches = gamesData.games.map((game) => mapGame(game, stadiums));
  return cachedMatches;
}
