import { Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MatchStatusBadge } from "../components/match/MatchStatusBadge";
import { PredictionListSkeleton } from "../components/ui/Skeleton";
import { useAuth } from "../context/AuthContext";
import { useLeague } from "../context/LeagueContext";
import { useMatches } from "../context/MatchesContext";
import { useToast } from "../context/ToastContext";
import { usePredictions } from "../hooks/usePredictions";
import { listLeagueMembers } from "../services/members";
import { loadPredictionsForMembers } from "../services/predictions";
import type { PredictionRecord } from "../types";
import {
  ALL_MATCHDAYS_KEY,
  buildMatchdayOptions,
  filterMatchesByMatchday,
  getDefaultMatchdayKey,
  groupMatchesByCalendarDay,
} from "../utils/matchFilters";
import { getFinishedMatches } from "../utils/matchStatus";
import { parseGoalsInput } from "../utils/scores";

type PredictionsView = "open" | "finished";

type LeaguePick = {
  userId: string;
  name: string;
  homeScore: number;
  awayScore: number;
};

export function PredictionsPage() {
  const { user } = useAuth();
  const { selectedLeague } = useLeague();
  const { matches, loading: matchesLoading, error: matchesError } = useMatches();
  const { showToast } = useToast();
  const {
    openMatches,
    draft,
    loading: predictionsLoading,
    saving,
    error,
    success,
    hasChanges,
    pendingChangeCount,
    updateScore,
    saveAll,
  } = usePredictions(selectedLeague?.id ?? null, user?.uid, matches);

  const finishedMatches = useMemo(() => getFinishedMatches(matches), [matches]);
  const [view, setView] = useState<PredictionsView>("open");
  const [picksByMatch, setPicksByMatch] = useState<Record<string, LeaguePick[]>>({});
  const [loadingClosed, setLoadingClosed] = useState(false);
  const [closedError, setClosedError] = useState("");

  const activeMatches = view === "open" ? openMatches : finishedMatches;
  const matchdayOptions = useMemo(() => buildMatchdayOptions(activeMatches), [activeMatches]);
  const [selectedMatchday, setSelectedMatchday] = useState<string | null>(null);
  const userPickedMatchdayRef = useRef(false);

  const loadClosed = useCallback(async () => {
    if (!selectedLeague) {
      setPicksByMatch({});
      return;
    }

    setLoadingClosed(true);
    setClosedError("");

    try {
      const members = await listLeagueMembers(selectedLeague.id);
      const matchIds = finishedMatches.map((match) => match.id);
      const predictions = await loadPredictionsForMembers(
        selectedLeague.id,
        members.map((member) => member.userId),
        matchIds,
      );

      const names = new Map(members.map((member) => [member.userId, member.displayName]));
      const grouped: Record<string, LeaguePick[]> = {};

      predictions.forEach((prediction) => {
        const entry: LeaguePick = {
          userId: prediction.userId,
          name: names.get(prediction.userId) ?? "Jugador",
          homeScore: prediction.homeScore,
          awayScore: prediction.awayScore,
        };

        grouped[prediction.matchId] = [...(grouped[prediction.matchId] ?? []), entry];
      });

      Object.values(grouped).forEach((entries) => {
        entries.sort((a, b) => a.name.localeCompare(b.name, "es"));
      });

      setPicksByMatch(grouped);
    } catch (err) {
      setClosedError(err instanceof Error ? err.message : "No pudimos cargar predicciones cerradas.");
      setPicksByMatch({});
    } finally {
      setLoadingClosed(false);
    }
  }, [finishedMatches, selectedLeague]);

  useEffect(() => {
    if (view === "finished") {
      void loadClosed();
    }
  }, [loadClosed, view]);

  useEffect(() => {
    if (success) showToast(success, "success");
  }, [showToast, success]);

  useEffect(() => {
    if (error) showToast(error, "error");
  }, [error, showToast]);

  useEffect(() => {
    userPickedMatchdayRef.current = false;
  }, [view]);

  useEffect(() => {
    if (activeMatches.length === 0) {
      setSelectedMatchday(ALL_MATCHDAYS_KEY);
      return;
    }

    if (!userPickedMatchdayRef.current) {
      setSelectedMatchday(getDefaultMatchdayKey(activeMatches));
      return;
    }

    setSelectedMatchday((current) => {
      if (!current) return getDefaultMatchdayKey(activeMatches);

      const stillValid =
        current === ALL_MATCHDAYS_KEY ||
        activeMatches.some((match) => match.matchday === current);

      return stillValid ? current : getDefaultMatchdayKey(activeMatches);
    });
  }, [activeMatches]);

  const visibleMatches = useMemo(() => {
    if (!selectedMatchday) return [];
    return filterMatchesByMatchday(activeMatches, selectedMatchday);
  }, [activeMatches, selectedMatchday]);

  const dayGroups = useMemo(() => groupMatchesByCalendarDay(visibleMatches), [visibleMatches]);
  const selectedOption = matchdayOptions.find((option) => option.key === selectedMatchday);

  if (!selectedLeague) {
    return (
      <section className="content-page">
        <p className="page-copy">Selecciona o crea una liga para capturar predicciones.</p>
      </section>
    );
  }

  const loading =
    matchesLoading || (view === "open" ? predictionsLoading : loadingClosed);
  const saveLabel =
    pendingChangeCount > 0
      ? `Guardar cambios (${pendingChangeCount})`
      : "Guardar cambios";

  return (
    <section className="content-page">
      <div className="predictions-header">
        <div className="section-heading">
          <span>{selectedLeague.name}</span>
          <h2>Predicciones</h2>
        </div>
        {view === "open" && (
          <button
            className="primary-button"
            type="button"
            onClick={saveAll}
            disabled={loading || saving || !hasChanges || openMatches.length === 0}
          >
            <Save size={18} />
            {saving ? "Guardando..." : saveLabel}
          </button>
        )}
      </div>

      <div className="predictions-view-toggle" role="tablist" aria-label="Vista de partidos">
        <button
          type="button"
          role="tab"
          aria-selected={view === "open"}
          className={`predictions-view-tab${view === "open" ? " active" : ""}`}
          onClick={() => setView("open")}
        >
          Abiertos
          <small>{openMatches.length}</small>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "finished"}
          className={`predictions-view-tab${view === "finished" ? " active" : ""}`}
          onClick={() => setView("finished")}
        >
          Finalizados
          <small>{finishedMatches.length}</small>
        </button>
      </div>

      <p className="page-copy">
        {view === "open"
          ? "Elige la jornada que quieres pronosticar. Solo se guardan los partidos que modifiques."
          : "Resultados oficiales y predicciones de todos los miembros de la liga."}
        {view === "open" && hasChanges && !saving ? " Tienes cambios sin guardar." : ""}
      </p>

      {matchesError && <p className="auth-error">{matchesError}</p>}
      {view === "finished" && closedError && <p className="auth-error">{closedError}</p>}

      {loading && <PredictionListSkeleton count={view === "open" ? 5 : 3} />}

      {!loading && activeMatches.length === 0 && (
        <p className="page-copy">
          {view === "open"
            ? "No hay partidos abiertos para pronosticar en este momento."
            : "Aun no hay partidos finalizados."}
        </p>
      )}

      {!loading && activeMatches.length > 0 && (
        <>
          <div className="matchday-filters" role="tablist" aria-label="Filtrar por jornada">
            {matchdayOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                role="tab"
                aria-selected={selectedMatchday === option.key}
                className={`matchday-chip${selectedMatchday === option.key ? " active" : ""}`}
                onClick={() => {
                  userPickedMatchdayRef.current = true;
                  setSelectedMatchday(option.key);
                }}
              >
                <span>{option.label}</span>
                <small>{option.count}</small>
              </button>
            ))}
          </div>

          <p className="predictions-scope">
            {visibleMatches.length} partido{visibleMatches.length === 1 ? "" : "s"}
            {selectedOption ? ` · ${selectedOption.label}` : ""}
            {selectedOption?.dateLabel ? ` · ${selectedOption.dateLabel}` : ""}
          </p>
        </>
      )}

      {!loading &&
        dayGroups.map((dayGroup) => (
          <section className="prediction-day-group" key={dayGroup.key}>
            <h3 className="prediction-day-heading">
              {dayGroup.label}
              <span>{dayGroup.matches.length} partidos</span>
            </h3>

            <div className="prediction-list">
              {dayGroup.matches.map((match) => {
                if (view === "finished") {
                  const picks = picksByMatch[match.id] ?? [];

                  return (
                    <article className="prediction-row finished" key={match.id}>
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
                      <div className="prediction-summary">
                        <MatchStatusBadge match={match} />
                        <ul className="league-picks">
                          {picks.length === 0 ? (
                            <li className="league-pick empty">Nadie pronostico este partido</li>
                          ) : (
                            picks.map((pick) => (
                              <li
                                className={`league-pick${pick.userId === user?.uid ? " own" : ""}`}
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
                    </article>
                  );
                }

                const scores = draft[match.id] ?? { homeScore: 0, awayScore: 0 };

                return (
                  <article className="prediction-row" key={match.id}>
                    <div className="match-meta">
                      <strong>{match.group}</strong>
                      <span>
                        {match.date} - {match.venue}
                      </span>
                    </div>
                    <div className="teams">
                      <span>{match.home}</span>
                      <div className="score-inputs">
                        <input
                          type="number"
                          min={0}
                          max={15}
                          aria-label={`Goles de ${match.home}`}
                          value={scores.homeScore}
                          onChange={(event) =>
                            updateScore(match.id, "homeScore", parseGoalsInput(event.target.value))
                          }
                        />
                        <span>-</span>
                        <input
                          type="number"
                          min={0}
                          max={15}
                          aria-label={`Goles de ${match.away}`}
                          value={scores.awayScore}
                          onChange={(event) =>
                            updateScore(match.id, "awayScore", parseGoalsInput(event.target.value))
                          }
                        />
                      </div>
                      <span>{match.away}</span>
                    </div>
                    <MatchStatusBadge match={match} />
                  </article>
                );
              })}
            </div>
          </section>
        ))}
    </section>
  );
}
