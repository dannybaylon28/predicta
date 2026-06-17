import { useState } from "react";
import { ChevronDown, ChevronUp, Crown } from "lucide-react";
import { LeaderboardSkeleton } from "../components/ui/Skeleton";
import { useLeague } from "../context/LeagueContext";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { scoringLabels } from "../constants/scoring";
import { calculateMatchPoints } from "../utils/scoring";

export function LeaderboardPage() {
  const { selectedLeague } = useLeague();
  const { entries, predictions, finishedMatches, finishedMatchCount, loading, error } = useLeaderboard(selectedLeague);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

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
            const isExpanded = expandedMemberId === member.id;
            const toggleExpand = () => setExpandedMemberId(isExpanded ? null : member.id);

            return (
              <div key={member.id} style={{ display: "contents" }}>
                <article
                  className={`leader-row${index < 3 ? ` podium-${index + 1}` : ""}${inPrizeZone ? " prize-zone" : ""}${isExpanded ? " expanded" : ""}`}
                  onClick={toggleExpand}
                  style={{ cursor: "pointer" }}
                >
                  <span className="rank">{index + 1}</span>
                  <span className="avatar">{member.initials}</span>
                  <span className="member-name">{member.name}</span>
                  <span className="exact">{member.resultHits} aciertos</span>
                  <span className="exact">{member.exacts} exactos</span>
                  <strong>{member.points} pts</strong>
                  <span className="expand-icon">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </article>

                {isExpanded && (
                  <div className="leader-member-details">
                    <h4>Detalle de puntos - {member.name}</h4>
                    {finishedMatches.length === 0 ? (
                      <p className="no-details">No hay partidos finalizados en el torneo.</p>
                    ) : (
                      <ul className="member-details-list">
                        {finishedMatches.map((match) => {
                          const pred = predictions.find(
                            (p) => p.userId === member.id && p.matchId === match.id,
                          );
                          const outcome = pred
                            ? calculateMatchPoints(
                                {
                                  scoringMode: selectedLeague.scoringMode,
                                  resultPoints: selectedLeague.resultPoints,
                                  exactBonus: selectedLeague.exactBonus,
                                },
                                { homeScore: pred.homeScore, awayScore: pred.awayScore },
                                { homeScore: match.homeScore!, awayScore: match.awayScore! },
                              )
                            : { points: 0, isExact: false, isResultCorrect: false };

                          const pointsStyle = outcome.points > 0 ? "points-positive" : "points-zero";
                          let hitLabel = "";
                          if (outcome.isExact) hitLabel = "Exacto";
                          else if (outcome.isResultCorrect) hitLabel = "Acierto";

                          return (
                            <li key={match.id} className="member-detail-item">
                              <div className="detail-match-info">
                                <strong>{match.home} vs {match.away}</strong>
                                <span>(Resultado: {match.homeScore}-{match.awayScore})</span>
                              </div>
                              <div className="detail-pred-info">
                                <span>
                                  Pronóstico: {pred ? `${pred.homeScore}-${pred.awayScore}` : "Sin pronóstico"}
                                </span>
                                {hitLabel && (
                                  <span className={`hit-badge ${hitLabel.toLowerCase()}`}>{hitLabel}</span>
                                )}
                                <strong className={pointsStyle}>+{outcome.points} pts</strong>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
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
