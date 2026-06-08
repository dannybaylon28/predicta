import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { MatchRowsSkeleton } from "../components/ui/Skeleton";
import { useMatches } from "../context/MatchesContext";
import { getFinishedMatches } from "../utils/matchStatus";

export function LandingPage() {
  const { openMatches, matches, loading, error } = useMatches();
  const previewMatches = openMatches.slice(0, 3);
  const finishedCount = getFinishedMatches(matches).length;

  return (
    <section className="landing">
      <div className="landing-main">
        <p className="kicker">Mundial 2026</p>
        <h1>
          Tu quiniela.
          <span className="headline-accent">Tus reglas.</span>
        </h1>
        <p className="hero-subtitle">
          Arma ligas privadas con tu gente, marca cada partido y sigue la tabla en tiempo real.
          Tu decides si puntúa el resultado, el marcador exacto o ambos.
        </p>
        <div className="hero-actions">
          <Link className="primary-button" to="/crear">
            Crear mi liga
            <ArrowRight size={19} />
          </Link>
          <Link className="secondary-button" to="/entrar">
            Iniciar sesion
          </Link>
        </div>
        <div className="landing-steps">
          <div>
            <span>01</span>
            <p>Configura nombre, premio y puntos</p>
          </div>
          <div>
            <span>02</span>
            <p>Invita por link o codigo</p>
          </div>
          <div>
            <span>03</span>
            <p>Marca y compite jornada a jornada</p>
          </div>
        </div>
      </div>

      <aside className="scoreboard-panel" aria-label="Vista previa de la quiniela">
        <header className="scoreboard-header">
          <span className="live-tag">Partidos reales</span>
          <span>Mundial 2026</span>
        </header>
        {loading && <MatchRowsSkeleton count={3} />}
        {error && <p className="panel-status error">{error}</p>}
        {!loading && !error && (
          <ul className="ticket-list">
            {previewMatches.map((match) => (
              <li className="ticket" key={match.id}>
                <div className="ticket-meta">
                  <span>{match.date}</span>
                  <span>{match.venue}</span>
                </div>
                <div className="ticket-teams">
                  <span>{match.home}</span>
                  <span className="ticket-score">vs</span>
                  <span>{match.away}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <footer className="scoreboard-footer">
          <span>Calendario oficial</span>
          <div className="leader-preview landing-stats">
            <div className="leader-preview-row">
              <span>Partidos abiertos</span>
              <strong>{openMatches.length}</strong>
            </div>
            <div className="leader-preview-row">
              <span>Finalizados</span>
              <strong>{finishedCount}</strong>
            </div>
            <p className="panel-status">Crea tu liga para ver la clasificacion en vivo.</p>
          </div>
        </footer>
      </aside>
    </section>
  );
}
