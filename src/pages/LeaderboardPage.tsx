import { Crown } from "lucide-react";
import { LeaderboardSkeleton } from "../components/ui/Skeleton";
import { useLeague } from "../context/LeagueContext";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { scoringLabels } from "../constants/scoring";

export function LeaderboardPage() {
  const { selectedLeague } = useLeague();
  const { entries, finishedMatchCount, loading, error } = useLeaderboard(selectedLeague);

  if (!selectedLeague) {
    return (
      <section className="content-page">
        <p className="page-copy">Selecciona o crea una liga para ver la clasificacion.</p>
      </section>
    );
  }

  return (
    <section className="content-page">
      <div className="league-header flat">
        <div>
          <p className="overline">{selectedLeague.name}</p>
          <h2>Clasificacion</h2>
          <p>
            Los primeros {selectedLeague.winners} lugares cobran premio · Modo{" "}
            {scoringLabels[selectedLeague.scoringMode].toLowerCase()}
          </p>
        </div>
        <Crown className="crown" size={44} />
      </div>

      {loading && <LeaderboardSkeleton count={4} />}
      {error && <p className="auth-error">{error}</p>}

      {!loading && !error && (
        <p className="page-copy">
          {finishedMatchCount === 0
            ? "Aun no hay partidos finalizados. La tabla se actualizara cuando la API publique resultados."
            : `Basado en ${finishedMatchCount} partido${finishedMatchCount === 1 ? "" : "s"} finalizado${finishedMatchCount === 1 ? "" : "s"}.`}
        </p>
      )}

      {!loading && !error && entries.length > 0 && (
        <div className="leaderboard">
          {entries.map((member, index) => {
            const inPrizeZone = index < selectedLeague.winners;

            return (
              <article
                className={`leader-row${index < 3 ? ` podium-${index + 1}` : ""}${inPrizeZone ? " prize-zone" : ""}`}
                key={member.id}
              >
                <span className="rank">{index + 1}</span>
                <span className="avatar">{member.initials}</span>
                <span className="member-name">{member.name}</span>
                <span className="exact">{member.resultHits} aciertos</span>
                <span className="exact">{member.exacts} exactos</span>
                <strong>{member.points} pts</strong>
              </article>
            );
          })}
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <p className="page-copy">Esta liga aun no tiene miembros registrados.</p>
      )}
    </section>
  );
}
