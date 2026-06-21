import { Save, Shield } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MatchStatusBadge } from "../components/match/MatchStatusBadge";
import { ScoreInput } from "../components/predictions/ScoreInput";
import { PredictionListSkeleton } from "../components/ui/Skeleton";
import { useLeague } from "../context/LeagueContext";
import { useMatches } from "../context/MatchesContext";
import { useToast } from "../context/ToastContext";
import { listLeagueMembers, type LeagueMemberRecord } from "../services/members";
import {
  adminDeleteMemberPrediction,
  adminSaveMemberPrediction,
  isCompleteScorePair,
  isEmptyScorePair,
  loadUserPredictions,
  type ScorePair,
} from "../services/predictions";
import type { Match } from "../types";
import {
  ALL_MATCHDAYS_KEY,
  buildMatchdayOptions,
  filterMatchesByMatchday,
  groupMatchesByCalendarDay,
} from "../utils/matchFilters";
import { sortMatchesByKickoff } from "../utils/matchStatus";

type ScoreDraft = Record<string, ScorePair>;
type SavedSnapshot = Record<string, ScorePair>;

function buildDraftFromSaved(
  matches: Match[],
  saved: Record<string, { homeScore: number; awayScore: number }>,
): ScoreDraft {
  const draft: ScoreDraft = {};
  matches.forEach((match) => {
    const existing = saved[match.id];
    draft[match.id] = {
      homeScore: existing?.homeScore ?? null,
      awayScore: existing?.awayScore ?? null,
    };
  });
  return draft;
}

export function AdminPanelPage() {
  const { leagues, loading: leaguesLoading } = useLeague();
  const { matches, loading: matchesLoading } = useMatches();
  const { showToast } = useToast();

  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [members, setMembers] = useState<LeagueMemberRecord[]>([]);
  const [selectedMatchday, setSelectedMatchday] = useState<string | null>(null);
  const [draft, setDraft] = useState<ScoreDraft>({});
  const [savedSnapshot, setSavedSnapshot] = useState<SavedSnapshot>({});
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const sortedMatches = useMemo(() => sortMatchesByKickoff(matches), [matches]);
  const matchdayOptions = useMemo(() => buildMatchdayOptions(sortedMatches), [sortedMatches]);

  useEffect(() => {
    if (leagues.length > 0 && !selectedLeagueId) {
      setSelectedLeagueId(leagues[0].id);
    }
  }, [leagues, selectedLeagueId]);

  useEffect(() => {
    if (!selectedLeagueId) {
      setMembers([]);
      setSelectedMemberId(null);
      return;
    }

    setLoadingMembers(true);
    setError("");

    void listLeagueMembers(selectedLeagueId)
      .then((nextMembers) => {
        setMembers(nextMembers);
        setSelectedMemberId((current) => {
          if (current && nextMembers.some((member) => member.userId === current)) return current;
          return nextMembers[0]?.userId ?? null;
        });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No pudimos cargar los miembros.");
        setMembers([]);
        setSelectedMemberId(null);
      })
      .finally(() => setLoadingMembers(false));
  }, [selectedLeagueId]);

  const loadMemberPredictions = useCallback(async () => {
    if (!selectedLeagueId || !selectedMemberId) {
      setDraft({});
      setSavedSnapshot({});
      return;
    }

    setLoadingPredictions(true);
    setError("");

    try {
      const savedRecords = await loadUserPredictions(selectedLeagueId, selectedMemberId);
      const saved: Record<string, { homeScore: number; awayScore: number }> = {};
      Object.values(savedRecords).forEach((record) => {
        saved[record.matchId] = {
          homeScore: record.homeScore,
          awayScore: record.awayScore,
        };
      });

      const nextDraft = buildDraftFromSaved(sortedMatches, saved);
      setSavedSnapshot(nextDraft);
      setDraft(nextDraft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos cargar las predicciones.");
      setDraft(buildDraftFromSaved(sortedMatches, {}));
      setSavedSnapshot({});
    } finally {
      setLoadingPredictions(false);
    }
  }, [selectedLeagueId, selectedMemberId, sortedMatches]);

  useEffect(() => {
    void loadMemberPredictions();
  }, [loadMemberPredictions]);

  useEffect(() => {
    if (sortedMatches.length === 0) {
      setSelectedMatchday(ALL_MATCHDAYS_KEY);
      return;
    }

    setSelectedMatchday((current) => {
      if (!current || current === ALL_MATCHDAYS_KEY) return ALL_MATCHDAYS_KEY;
      return sortedMatches.some((match) => match.matchday === current)
        ? current
        : ALL_MATCHDAYS_KEY;
    });
  }, [sortedMatches]);

  const visibleMatches = useMemo(() => {
    if (!selectedMatchday) return [];
    return filterMatchesByMatchday(sortedMatches, selectedMatchday, "asc");
  }, [selectedMatchday, sortedMatches]);

  const dayGroups = useMemo(
    () => groupMatchesByCalendarDay(visibleMatches, "asc"),
    [visibleMatches],
  );

  const selectedMember = members.find((member) => member.userId === selectedMemberId) ?? null;
  const selectedLeague = leagues.find((league) => league.id === selectedLeagueId) ?? null;
  const loading = leaguesLoading || matchesLoading || loadingMembers || loadingPredictions;

  const updateScore = (matchId: string, side: "homeScore" | "awayScore", value: number | null) => {
    setDraft((current) => ({
      ...current,
      [matchId]: {
        homeScore: side === "homeScore" ? value : (current[matchId]?.homeScore ?? null),
        awayScore: side === "awayScore" ? value : (current[matchId]?.awayScore ?? null),
      },
    }));
  };

  const hasMatchChanges = (matchId: string) => {
    const current = draft[matchId];
    const saved = savedSnapshot[matchId];
    if (!current || !saved) return false;
    return current.homeScore !== saved.homeScore || current.awayScore !== saved.awayScore;
  };

  const saveMatch = async (match: Match) => {
    if (!selectedLeagueId || !selectedMemberId) return;

    const scores = draft[match.id];
    if (!scores) return;

    setSavingMatchId(match.id);
    setError("");

    try {
      if (isEmptyScorePair(scores)) {
        await adminDeleteMemberPrediction(selectedLeagueId, selectedMemberId, match.id);
        const empty = { homeScore: null, awayScore: null };
        setSavedSnapshot((current) => ({ ...current, [match.id]: empty }));
        showToast(`Prediccion eliminada para ${match.home} vs ${match.away}.`, "success");
        return;
      }

      if (!isCompleteScorePair(scores)) {
        showToast("Completa ambos lados del marcador o borra los dos campos.", "error");
        return;
      }

      await adminSaveMemberPrediction(
        selectedLeagueId,
        selectedMemberId,
        match.id,
        scores.homeScore,
        scores.awayScore,
        match.kickoffAt,
      );

      setSavedSnapshot((current) => ({
        ...current,
        [match.id]: { ...scores },
      }));
      showToast(`Prediccion guardada para ${match.home} vs ${match.away}.`, "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No pudimos guardar la prediccion.";
      setError(message);
      showToast(message, "error");
    } finally {
      setSavingMatchId(null);
    }
  };

  return (
    <section className="content-page admin-panel">
      <div className="league-header flat">
        <div>
          <p className="overline">Acceso restringido</p>
          <h2>Panel de administrador</h2>
          <p>Edita las predicciones de cualquier miembro en las ligas donde participas.</p>
        </div>
        <Shield className="crown" size={44} />
      </div>

      <div className="admin-panel-controls">
        <label className="admin-field">
          <span>Liga</span>
          <select
            value={selectedLeagueId ?? ""}
            onChange={(event) => {
              setSelectedLeagueId(event.target.value || null);
              setSelectedMemberId(null);
            }}
            disabled={leagues.length === 0}
          >
            {leagues.length === 0 ? (
              <option value="">Sin ligas</option>
            ) : (
              leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))
            )}
          </select>
        </label>

        <label className="admin-field">
          <span>Miembro</span>
          <select
            value={selectedMemberId ?? ""}
            onChange={(event) => setSelectedMemberId(event.target.value || null)}
            disabled={members.length === 0}
          >
            {members.length === 0 ? (
              <option value="">Sin miembros</option>
            ) : (
              members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.displayName}
                  {member.role === "admin" ? " (admin)" : ""}
                </option>
              ))
            )}
          </select>
        </label>
      </div>

      {selectedLeague && selectedMember && (
        <p className="predictions-scope">
          Editando predicciones de <strong>{selectedMember.displayName}</strong> en{" "}
          <strong>{selectedLeague.name}</strong>
        </p>
      )}

      {error && <p className="auth-error">{error}</p>}

      {loading && <PredictionListSkeleton count={5} />}

      {!loading && matchdayOptions.length > 0 && (
        <div className="matchday-filters" role="tablist" aria-label="Filtrar por jornada">
          {matchdayOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={selectedMatchday === option.key}
              className={`matchday-chip${selectedMatchday === option.key ? " active" : ""}`}
              onClick={() => setSelectedMatchday(option.key)}
            >
              <span>{option.label}</span>
              <small>{option.count}</small>
            </button>
          ))}
        </div>
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
                const scores = draft[match.id] ?? { homeScore: null, awayScore: null };
                const changed = hasMatchChanges(match.id);
                const isSaving = savingMatchId === match.id;

                return (
                  <article
                    className={`prediction-row admin-prediction-row${changed ? " prediction-row--unsaved" : ""}`}
                    key={match.id}
                  >
                    <div className="match-meta">
                      <strong>{match.group}</strong>
                      <span>
                        {match.date} - {match.venue}
                      </span>
                    </div>
                    <div className="teams">
                      <span>{match.home}</span>
                      <div className="score-inputs">
                        <ScoreInput
                          label={`Goles de ${match.home}`}
                          value={scores.homeScore}
                          onChange={(value) => updateScore(match.id, "homeScore", value)}
                        />
                        <span>-</span>
                        <ScoreInput
                          label={`Goles de ${match.away}`}
                          value={scores.awayScore}
                          onChange={(value) => updateScore(match.id, "awayScore", value)}
                        />
                      </div>
                      <span>{match.away}</span>
                    </div>
                    <div className="prediction-row-actions admin-prediction-actions">
                      <MatchStatusBadge match={match} />
                      {changed ? <span className="prediction-draft-hint">Sin guardar</span> : null}
                      <button
                        className="ghost-button compact"
                        type="button"
                        disabled={!changed || isSaving}
                        onClick={() => void saveMatch(match)}
                      >
                        <Save size={16} />
                        {isSaving ? "Guardando..." : "Guardar"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
    </section>
  );
}
