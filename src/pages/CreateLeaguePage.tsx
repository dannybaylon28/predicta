import { ArrowRight, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlanLimitError } from "../constants/plan";
import { getScoringDescription, scoringLabels } from "../constants/scoring";
import { useUpgrade } from "../context/UpgradeContext";
import { useLeague } from "../context/LeagueContext";
import { usePremium } from "../hooks/usePremium";
import type { ScoringMode } from "../types";

export function CreateLeaguePage() {
  const navigate = useNavigate();
  const { leagueDraft, setLeagueDraft, saveLeague, saving, saveError, clearSaveError } =
    useLeague();
  const { openUpgrade } = useUpgrade();
  const { isPremium, canCreateLeague, leaguesRemaining } = usePremium();
  const [formError, setFormError] = useState("");

  useEffect(() => {
    clearSaveError();
  }, [clearSaveError]);

  const scoringInfo = getScoringDescription(
    leagueDraft.scoringMode,
    leagueDraft.resultPoints,
    leagueDraft.exactBonus,
  );

  const handleCreate = async () => {
    setFormError("");
    try {
      await saveLeague();
      navigate("/mis-ligas");
    } catch (err) {
      if (err instanceof PlanLimitError) {
        openUpgrade(err.code);
        return;
      }
      setFormError(err instanceof Error ? err.message : "No pudimos crear la liga.");
    }
  };

  return (
    <section className="builder">
      <div className="builder-copy">
        <p className="overline">Nueva liga</p>
        <h2>Arma la quiniela como tu grupo la juega.</h2>
        <div className="plan-banner">
          {isPremium ? (
            <p>
              <strong>Premium activo.</strong> Puedes crear ligas ilimitadas para el Mundial 2026.
            </p>
          ) : (
            <p>
              Plan gratuito: <strong>{leaguesRemaining ?? 0}</strong> liga restante por torneo.{" "}
              {!canCreateLeague && (
                <>
                  Necesitas <Link to="/premium">Premium</Link> para crear otra.
                </>
              )}
            </p>
          )}
        </div>

        <div className="scoring-explainer" aria-live="polite">
          <p className="scoring-explainer-label">Modo seleccionado</p>
          <h3>{scoringInfo.title}</h3>
          <p>{scoringInfo.summary}</p>
          <p className="scoring-explainer-example">
            <strong>Ejemplo:</strong> {scoringInfo.example}
          </p>
        </div>
      </div>

      <form className="league-form" onSubmit={(event) => event.preventDefault()}>
        <label>
          Nombre de la liga
          <input
            value={leagueDraft.name}
            onChange={(event) => setLeagueDraft({ ...leagueDraft, name: event.target.value })}
          />
        </label>
        <label>
          Premio
          <input
            value={leagueDraft.prize}
            onChange={(event) => setLeagueDraft({ ...leagueDraft, prize: event.target.value })}
          />
        </label>
        <label>
          Cuantos ganadores
          <input
            type="number"
            min={1}
            max={20}
            value={leagueDraft.winners}
            onChange={(event) =>
              setLeagueDraft({ ...leagueDraft, winners: Number(event.target.value) })
            }
          />
        </label>

        <fieldset>
          <legend>Modo de puntuacion</legend>
          {(["result", "exact", "hybrid"] as ScoringMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={leagueDraft.scoringMode === mode ? "choice active" : "choice"}
              onClick={() => setLeagueDraft({ ...leagueDraft, scoringMode: mode })}
            >
              <Check size={18} />
              <span>{scoringLabels[mode]}</span>
            </button>
          ))}
        </fieldset>

        <div className="score-settings">
          <label>
            Puntos por resultado
            <input
              type="number"
              min={0}
              value={leagueDraft.resultPoints}
              onChange={(event) =>
                setLeagueDraft({ ...leagueDraft, resultPoints: Number(event.target.value) })
              }
            />
          </label>
          <label>
            Bonus marcador exacto
            <input
              type="number"
              min={0}
              value={leagueDraft.exactBonus}
              onChange={(event) =>
                setLeagueDraft({ ...leagueDraft, exactBonus: Number(event.target.value) })
              }
            />
          </label>
        </div>

        {(formError || saveError) && <p className="auth-error">{formError || saveError}</p>}

        <div className="form-footer">
          <Link className="secondary-button" to="/mis-ligas">
            Cancelar
          </Link>
          <button className="primary-button" type="button" onClick={handleCreate} disabled={saving}>
            {saving ? "Creando..." : "Crear liga"}
            <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </section>
  );
}
