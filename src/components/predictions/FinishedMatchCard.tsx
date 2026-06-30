import { ChevronDown } from "lucide-react";
import { MatchStatusBadge } from "../match/MatchStatusBadge";
import type { Advancer, Match } from "../../types";
import { isKnockoutStage } from "../../utils/knockout";

export type FinishedMatchPick = {
  userId: string;
  name: string;
  homeScore: number;
  awayScore: number;
  advancer?: Advancer;
};

type FinishedMatchCardProps = {
  match: Match;
  picks: FinishedMatchPick[];
  currentUserId?: string;
  expanded: boolean;
  onToggle: () => void;
};

export function FinishedMatchCard({
  match,
  picks,
  currentUserId,
  expanded,
  onToggle,
}: FinishedMatchCardProps) {
  const pickLabel =
    picks.length === 0
      ? "Sin pronosticos"
      : `${picks.length} pronostico${picks.length === 1 ? "" : "s"}`;

  const isKo = isKnockoutStage(match.stage);
  const advancerName = match.advancer
    ? match.advancer === "home"
      ? match.home
      : match.away
    : null;
  const has90 =
    match.regulationHomeScore !== undefined && match.regulationAwayScore !== undefined;
  // Mostramos el detalle KO cuando se definio tras un empate (TE/penales).
  const showKoDetail = isKo && match.decidedInExtraTime && advancerName;

  return (
    <article className={`finished-match-card${expanded ? " expanded" : ""}`}>
      <button
        type="button"
        className="finished-match-header"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <div className="finished-match-main">
          <div className="match-meta">
            <strong>{match.group}</strong>
            <span>
              {match.date} - {match.venue}
            </span>
          </div>
          <div className="teams">
            <span>{match.home}</span>
            <div className="score-final">
              <strong>{match.homeScore}</strong>
              <span>-</span>
              <strong>{match.awayScore}</strong>
            </div>
            <span>{match.away}</span>
          </div>
          {showKoDetail && (
            <p className="finished-ko-detail">
              {has90 ? `90': ${match.regulationHomeScore}-${match.regulationAwayScore} · ` : ""}
              Avanzó <strong>{advancerName}</strong>
            </p>
          )}
        </div>
        <div className="finished-match-toggle">
          <MatchStatusBadge match={match} />
          <span className="finished-match-pick-count">
            {pickLabel}
            <ChevronDown size={16} aria-hidden="true" />
          </span>
        </div>
      </button>

      {expanded && (
        <div className="finished-picks-panel">
          <p className="finished-picks-heading">Predicciones de la liga</p>
          <ul className="league-picks">
            {picks.length === 0 ? (
              <li className="league-pick empty">Nadie pronostico este partido</li>
            ) : (
              picks.map((pick) => {
                const pickIsDraw = pick.homeScore === pick.awayScore;
                const showAdvance = Boolean(showKoDetail) && pickIsDraw && pick.advancer != null;
                const advanceHit = showAdvance && pick.advancer === match.advancer;

                return (
                  <li
                    className={`league-pick${pick.userId === currentUserId ? " own" : ""}`}
                    key={pick.userId}
                  >
                    <span>{pick.name}</span>
                    <span className="league-pick-result">
                      <strong>
                        {pick.homeScore}-{pick.awayScore}
                      </strong>
                      {showAdvance ? (
                        <small className={`pick-advance${advanceHit ? " hit" : " miss"}`}>
                          {pick.advancer === "home" ? match.home : match.away}
                          {advanceHit ? " ✓" : " ✗"}
                        </small>
                      ) : null}
                    </span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </article>
  );
}
