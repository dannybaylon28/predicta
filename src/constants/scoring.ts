import type { ScoringMode } from "../types";

export const scoringLabels: Record<ScoringMode, string> = {
  result: "Solo resultado",
  exact: "Marcador exacto",
  hybrid: "Hibrido con bonus",
};

type ScoringDescription = {
  title: string;
  summary: string;
  example: string;
};

export function getScoringDescription(
  mode: ScoringMode,
  resultPoints: number,
  exactBonus: number,
): ScoringDescription {
  switch (mode) {
    case "result":
      return {
        title: scoringLabels.result,
        summary:
          "Cada jugador suma puntos si acierta quien gana el partido o si termina en empate. No importa si el marcador no coincide.",
        example: `Predices 2-1 y el resultado es 3-0 (gana el mismo equipo) → +${resultPoints} pts. Si fallas el ganador → 0 pts.`,
      };
    case "exact":
      return {
        title: scoringLabels.exact,
        summary:
          "Solo puntua quien clave el marcador exacto. Acertar unicamente el ganador no suma en este modo.",
        example: `Predices 2-1 y el resultado es 2-1 → +${resultPoints} pts. Cualquier otro marcador, aunque aciertes al ganador → 0 pts.`,
      };
    case "hybrid":
      return {
        title: scoringLabels.hybrid,
        summary:
          "Primero sumas por acertar el resultado (ganador o empate) y, si ademas clavas el marcador exacto, recibes un bonus adicional.",
        example: `Predices 2-1, resultado 2-1 → +${resultPoints} pts + ${exactBonus} bonus. Resultado 3-0 (mismo ganador) → solo +${resultPoints} pts.`,
      };
  }
}
