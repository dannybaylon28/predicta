import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Copy,
  Gauge,
  Link as LinkIcon,
  Plus,
  Settings,
  Trophy,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { buildJoinUrl } from "../utils/inviteLink";
import { InviteQrPanel } from "../components/invite/InviteQrPanel";
import { MatchRows } from "../components/match/MatchRows";
import { Metric } from "../components/ui/Metric";
import { APP_NAME } from "../constants/brand";
import { scoringLabels } from "../constants/scoring";
import { useLeague } from "../context/LeagueContext";
import { useMatches } from "../context/MatchesContext";
import { useToast } from "../context/ToastContext";

export function DashboardPage() {
  const { leagues, selectedLeague, selectedLeagueId, setSelectedLeagueId, loading, loadError } =
    useLeague();
  const { openMatches } = useMatches();
  const { showToast } = useToast();

  if (loading) {
    return (
      <section className="content-page">
        <p className="auth-loading">Cargando tus ligas...</p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="content-page">
        <p className="auth-error">{loadError}</p>
      </section>
    );
  }

  if (!selectedLeague) {
    return (
      <section className="content-page empty-state">
        <p className="overline">Sin ligas todavia</p>
        <h2>Crea tu primera quiniela</h2>
        <p className="page-copy">
          Configura las reglas, invita a tu grupo y empieza a marcar los 104 partidos del Mundial
          2026.
        </p>
        <div className="hero-actions">
          <Link className="primary-button" to="/crear">
            <Plus size={18} />
            Crear mi liga
          </Link>
          <Link className="secondary-button" to="/unirse">
            Unirme con codigo
          </Link>
        </div>
      </section>
    );
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(selectedLeague.inviteCode);
      showToast("Codigo copiado.");
    } catch {
      showToast("No pudimos copiar el codigo.", "error");
    }
  };

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(buildJoinUrl(selectedLeague.inviteCode));
      showToast("Link de invitacion copiado.");
    } catch {
      showToast("No pudimos copiar el link.", "error");
    }
  };

  const handleShareLeague = async () => {
    const inviteUrl = buildJoinUrl(selectedLeague.inviteCode);
    const shareText = `Unete a "${selectedLeague.name}" en ${APP_NAME}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: selectedLeague.name,
          text: shareText,
          url: inviteUrl,
        });
        showToast("Invitacion compartida.");
        return;
      }

      await navigator.clipboard.writeText(inviteUrl);
      showToast("Link de invitacion copiado.");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      showToast("No pudimos compartir la liga.", "error");
    }
  };

  return (
    <section className="page-grid">
      <aside className="league-rail">
        <div className="section-heading">
          <span>Tus competencias</span>
          <h2>Mis ligas</h2>
        </div>
        <div className="league-list">
          {leagues.map((league) => (
            <button
              key={league.id}
              className={league.id === selectedLeagueId ? "league-pill active" : "league-pill"}
              onClick={() => setSelectedLeagueId(league.id)}
              type="button"
            >
              <span>
                <strong>{league.name}</strong>
                <small>{league.members} participantes</small>
              </span>
              <ChevronRight size={18} />
            </button>
          ))}
        </div>
        <Link className="primary-button full" to="/crear">
          <Plus size={18} />
          Crear otra liga
        </Link>
        <Link className="secondary-button full" to="/unirse">
          Unirme a una liga
        </Link>
      </aside>

      <div className="dashboard-main">
        <div className="league-header">
          <div>
            <p className="overline">Liga activa</p>
            <h2>{selectedLeague.name}</h2>
            <p>{selectedLeague.prize}</p>
          </div>
          <div className="invite-box">
            <span>Codigo de invitacion</span>
            <strong>{selectedLeague.inviteCode}</strong>
            <button className="icon-button" aria-label="Copiar codigo" onClick={handleCopyCode} type="button">
              <Copy size={18} />
            </button>
          </div>
        </div>

        <div className="stat-strip">
          <Metric icon={<Users size={20} />} label="Participantes" value={selectedLeague.members} />
          <Metric icon={<Trophy size={20} />} label="Ganadores" value={selectedLeague.winners} />
          <Metric
            icon={<Gauge size={20} />}
            label="Modo"
            value={scoringLabels[selectedLeague.scoringMode]}
          />
          <Metric
            icon={<CalendarDays size={20} />}
            label="Partidos abiertos"
            value={openMatches.length}
          />
        </div>

        <div className="action-band">
          <Link to="/predicciones">
            <ClipboardList size={20} />
            Capturar predicciones
          </Link>
          <Link to="/clasificacion">
            <BarChart3 size={20} />
            Ver clasificacion
          </Link>
          <Link to="/reglas">
            <Settings size={20} />
            Ver reglas
          </Link>
          <button type="button" onClick={handleShareLeague}>
            <LinkIcon size={20} />
            Compartir liga
          </button>
        </div>

        <InviteQrPanel
          leagueName={selectedLeague.name}
          inviteCode={selectedLeague.inviteCode}
          onCopyLink={handleCopyInviteLink}
        />

        <section className="schedule-board">
          <div className="section-heading">
            <span>Proximos partidos</span>
            <h2>Pronosticos pendientes</h2>
          </div>
          <MatchRows limit={6} />
        </section>
      </div>
    </section>
  );
}
