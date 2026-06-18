import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Crown } from "lucide-react";
import { LeaderboardSkeleton } from "../components/ui/Skeleton";
import { useLeague } from "../context/LeagueContext";
import { useMatches } from "../context/MatchesContext";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { scoringLabels } from "../constants/scoring";
import { computeLeaderboard } from "../services/leaderboard";
import { calculateMatchPoints } from "../utils/scoring";
import { buildLeaderboardMatchdayTabs } from "../utils/matchFilters";

const GENERAL_TAB = "general";

export function LeaderboardPage() {
  const { selectedLeague } = useLeague();
  const { matches } = useMatches();
  const { entries, members, predictions, finishedMatches, finishedMatchCount, loading, error } =
    useLeaderboard(selectedLeague);
  const [selectedTab, setSelectedTab] = useState(GENERAL_TAB);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  const matchdayTabs = useMemo(() => buildLeaderboardMatchdayTabs(matches), [matches]);

  const scopedFinishedMatches = useMemo(() => {
    if (selectedTab === GENERAL_TAB) return finishedMatches;
    return finishedMatches.filter((match) => match.matchday === selectedTab);
  }, [finishedMatches, selectedTab]);

  const displayedEntries = useMemo(() => {
    if (!selectedLeague) return [];
    if (selectedTab === GENERAL_TAB) return entries;
    return computeLeaderboard(selectedLeague, members, predictions, scopedFinishedMatches);
  }, [entries, members, predictions, scopedFinishedMatches, selectedLeague, selectedTab]);

  const selectedMatchday = matchdayTabs.find((option) => option.key === selectedTab);

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

      {loading && (
        <>
          <p className="predictions-scope">Cargando clasificacion...</p>
          <LeaderboardSkeleton count={6} />
        </>
      )}
      {error && <p className="auth-error">{error}</p>}

      {!loading && !error && matchdayTabs.length > 0 && (
        <div className="matchday-filters" role="tablist" aria-label="Clasificacion por jornada">
          <button
            type="button"
            role="tab"
            aria-selected={selectedTab === GENERAL_TAB}
            className={`matchday-chip${selectedTab === GENERAL_TAB ? " active" : ""}`}
            onClick={() => {
              setSelectedTab(GENERAL_TAB);
              setExpandedMemberId(null);
            }}
          >
            <span>General</span>
            <small>Totales</small>
          </button>
          {matchdayTabs.map((option) => (
            <button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={selectedTab === option.key}
              className={`matchday-chip${selectedTab === option.key ? " active" : ""}`}
              onClick={() => {
                setSelectedTab(option.key);
                setExpandedMemberId(null);
              }}
            >
              <span>{option.label}</span>
              <small>{option.dateLabel}</small>
            </button>
          ))}
        </div>
      )}

      {!loading && !error && (
        <p className="predictions-scope">
          {selectedTab === GENERAL_TAB ? (
            finishedMatchCount === 0 ? (
              "Aun no hay partidos finalizados."
            ) : (
              `Clasificacion general · ${finishedMatchCount} partido${finishedMatchCount === 1 ? "" : "s"} finalizado${finishedMatchCount === 1 ? "" : "s"}`
            )
          ) : scopedFinishedMatches.length === 0 ? (
            `Aun no hay partidos finalizados en ${selectedMatchday?.label ?? "esta jornada"}.`
          ) : (
            `${selectedMatchday?.label ?? "Jornada"} · ${scopedFinishedMatches.length} partido${scopedFinishedMatches.length === 1 ? "" : "s"} finalizado${scopedFinishedMatches.length === 1 ? "" : "s"}`
          )}
        </p>
      )}

      {!loading && !error && displayedEntries.length > 0 && (
        <div className="leaderboard">
          {displayedEntries.map((member, index) => {
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
                    {(() => {
                      if (scopedFinishedMatches.length === 0) {
                        return (
                          <p className="no-details">
                            {selectedTab === GENERAL_TAB
                              ? "No hay partidos finalizados en el torneo."
                              : "No hay partidos finalizados en esta jornada."}
                          </p>
                        );
                      }

                      const scoredItems = scopedFinishedMatches
                        .map((match) => {
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

                          return { match, pred, outcome };
                        })
                        .filter((item) => item.outcome.points > 0);

                      if (scoredItems.length === 0) {
                        return (
                          <p className="no-details">
                            {selectedTab === GENERAL_TAB
                              ? "No ha sumado puntos en ningún partido todavía."
                              : "No sumó puntos en esta jornada."}
                          </p>
                        );
                      }

                      return (
                        <ul className="member-details-list">
                          {scoredItems.map(({ match, pred, outcome }) => {
                            let hitLabel = "";
                            if (outcome.isExact) hitLabel = "Exacto";
                            else if (outcome.isResultCorrect) hitLabel = "Acierto";

                            return (
                              <li key={match.id} className="member-detail-item">
                                <div className="detail-match-info">
                                  <strong>
                                    {match.home} vs {match.away}
                                  </strong>
                                  <span>
                                    (Resultado: {match.homeScore}-{match.awayScore})
                                  </span>
                                </div>
                                <div className="detail-pred-info">
                                  <span>
                                    Pronóstico:{" "}
                                    {pred ? `${pred.homeScore}-${pred.awayScore}` : "Sin pronóstico"}
                                  </span>
                                  {hitLabel && (
                                    <span className={`hit-badge ${hitLabel.toLowerCase()}`}>
                                      {hitLabel}
                                    </span>
                                  )}
                                  <strong className="points-positive">+{outcome.points} pts</strong>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && displayedEntries.length === 0 && members.length > 0 && (
        <p className="page-copy">
          {selectedTab === GENERAL_TAB
            ? finishedMatchCount === 0
              ? "La tabla se actualizara cuando la API publique resultados."
              : "Todos los miembros tienen 0 puntos por ahora."
            : "Nadie ha sumado puntos en esta jornada todavía."}
        </p>
      )}

      {!loading && !error && members.length === 0 && (
        <p className="page-copy">Esta liga aun no tiene miembros registrados.</p>
      )}
    </section>
  );
}
