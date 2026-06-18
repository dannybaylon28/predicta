import { ChevronDown } from "lucide-react";
import { MatchStatusBadge } from "../match/MatchStatusBadge";
import type { Match } from "../../types";

export type FinishedMatchPick = {
  userId: string;
  name: string;
  homeScore: number;
  awayScore: number;
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
              picks.map((pick) => (
                <li
                  className={`league-pick${pick.userId === currentUserId ? " own" : ""}`}
                  key={pick.userId}
                >
                  <span>{pick.name}</span>
                  <strong>
                    {pick.homeScore}-{pick.awayScore}
                  </strong>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </article>
  );
}
