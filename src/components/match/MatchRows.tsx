import { MatchRowsSkeleton } from "../ui/Skeleton";
import { useMatches } from "../../context/MatchesContext";
import { MatchStatusBadge } from "./MatchStatusBadge";

type MatchRowsProps = {
  limit?: number;
};

export function MatchRows({ limit }: MatchRowsProps) {
  const { openMatches, loading, error } = useMatches();
  const rows = limit ? openMatches.slice(0, limit) : openMatches;

  if (loading) {
    return <MatchRowsSkeleton count={limit ?? 4} />;
  }

  if (error) {
    return <p className="auth-error">{error}</p>;
  }

  if (rows.length === 0) {
    return <p className="page-copy">No hay partidos abiertos en este momento.</p>;
  }

  return (
    <div className="match-rows">
      {rows.map((match) => (
        <article className="match-row" key={match.id}>
          <div>
            <strong>{match.home}</strong>
            <span>vs</span>
            <strong>{match.away}</strong>
          </div>
          <p>
            {match.date} - {match.venue}
          </p>
          <MatchStatusBadge match={match} />
        </article>
      ))}
    </div>
  );
}
