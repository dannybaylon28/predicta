import { ArrowRight, Users } from "lucide-react";
import { InviteQrPanel } from "../components/invite/InviteQrPanel";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { scoringLabels } from "../constants/scoring";
import { useAuth } from "../context/AuthContext";
import { useLeague } from "../context/LeagueContext";
import { useToast } from "../context/ToastContext";
import { getLeaguePreviewByCode, type LeaguePreview } from "../services/leagues";
import { PlanLimitError } from "../constants/plan";
import { APP_NAME } from "../constants/brand";
import { useUpgrade } from "../context/UpgradeContext";
import { buildJoinUrl, normalizeInviteCode } from "../utils/inviteLink";
import { resetPageMeta, setPageMeta } from "../utils/pageMeta";

export function JoinLeaguePage() {
  const { code: codeParam } = useParams();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { joinLeagueByCode, joining, joinError } = useLeague();
  const { openUpgrade } = useUpgrade();
  const { showToast } = useToast();

  const [codeInput, setCodeInput] = useState(codeParam ? normalizeInviteCode(codeParam) : "");
  const [preview, setPreview] = useState<LeaguePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(Boolean(codeParam));
  const [previewError, setPreviewError] = useState("");
  const [alreadyMember, setAlreadyMember] = useState(false);

  useEffect(() => {
    if (!codeParam) return;

    const code = normalizeInviteCode(codeParam);
    setCodeInput(code);
    setLoadingPreview(true);
    setPreviewError("");

    getLeaguePreviewByCode(code)
      .then((data) => setPreview(data))
      .catch((err) => {
        setPreview(null);
        setPreviewError(err instanceof Error ? err.message : "Codigo no valido.");
      })
      .finally(() => setLoadingPreview(false));
  }, [codeParam]);

  useEffect(() => {
    if (!preview) return;

    const inviteUrl = buildJoinUrl(preview.code);
    setPageMeta({
      title: `Unete a ${preview.name} | ${APP_NAME}`,
      description: `Premio: ${preview.prize}. ${preview.memberCount} participantes en esta liga privada.`,
      ogTitle: `Unete a ${preview.name} en ${APP_NAME}`,
      ogDescription: `Premio: ${preview.prize} · Modo ${scoringLabels[preview.scoringMode].toLowerCase()}`,
      ogUrl: inviteUrl,
    });
  }, [preview]);

  useEffect(() => () => resetPageMeta(), []);

  useEffect(() => {
    if (joinError) showToast(joinError, "error");
  }, [joinError, showToast]);

  const handleLookup = async () => {
    const code = normalizeInviteCode(codeInput);
    if (!code) {
      setPreviewError("Ingresa un codigo de invitacion.");
      return;
    }

    setLoadingPreview(true);
    setPreviewError("");
    setAlreadyMember(false);

    try {
      const data = await getLeaguePreviewByCode(code);
      setPreview(data);
      navigate(`/unirse/${code}`, { replace: true });
    } catch (err) {
      setPreview(null);
      setPreviewError(err instanceof Error ? err.message : "Codigo no valido.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleJoin = async () => {
    if (!preview) return;

    if (!user) {
      navigate("/entrar", { state: { from: `/unirse/${preview.code}` } });
      return;
    }

    setAlreadyMember(false);
    try {
      await joinLeagueByCode(preview.code);
      showToast(`Te uniste a ${preview.name}.`);
      navigate("/mis-ligas");
    } catch (err) {
      if (err instanceof PlanLimitError) {
        openUpgrade(err.code);
        return;
      }
      const message = err instanceof Error ? err.message : "No pudimos unirte a la liga.";
      if (message.includes("Ya perteneces")) {
        setAlreadyMember(true);
      }
    }
  };

  const displayName =
    profile?.displayName || user?.displayName || user?.email?.split("@")[0] || "Jugador";

  return (
    <section className="auth-page">
      <div className="auth-card join-card">
        <p className="overline">Invitacion</p>
        <h2>Unirme a una liga</h2>
        <p className="auth-copy">
          Pega el codigo que te compartio el admin o abre el link de invitacion directamente.
          {!user && " Puedes ver la liga sin cuenta; para unirte necesitas iniciar sesion."}
        </p>

        <div className="join-code-row">
          <label>
            Codigo de invitacion
            <input
              value={codeInput}
              onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
              placeholder="Ej. NKA29YMN"
              spellCheck={false}
            />
          </label>
          <button
            className="secondary-button"
            type="button"
            onClick={handleLookup}
            disabled={loadingPreview}
          >
            {loadingPreview ? "Buscando..." : "Buscar"}
          </button>
        </div>

        {previewError && <p className="auth-error">{previewError}</p>}

        {preview && (
          <article className="join-preview">
            <p className="scoring-explainer-label">Vista previa</p>
            <h3>{preview.name}</h3>
            <p>{preview.prize}</p>
            <ul className="join-preview-meta">
              <li>
                <Users size={16} />
                {preview.memberCount} participantes
              </li>
              <li>Admin: {preview.adminName}</li>
              <li>Modo: {scoringLabels[preview.scoringMode]}</li>
            </ul>
            <p className="join-preview-code">
              Codigo: <strong>{preview.code}</strong>
            </p>
            {preview.isFull && (
              <p className="auth-error">
                Esta liga ya alcanzo el limite gratuito de miembros. El administrador debe activar
                Premium.
              </p>
            )}
            <InviteQrPanel leagueName={preview.name} inviteCode={preview.code} />
          </article>
        )}

        {(joinError || alreadyMember) && (
          <p className="auth-error">
            {alreadyMember ? "Ya perteneces a esta liga. Ve a Mis ligas." : joinError}
          </p>
        )}

        <div className="form-footer">
          <Link className="secondary-button" to="/mis-ligas">
            Cancelar
          </Link>
          <button
            className="primary-button"
            type="button"
            onClick={handleJoin}
            disabled={!preview || joining || preview.isFull}
          >
            {joining
              ? "Uniendote..."
              : user
                ? `Unirme como ${displayName}`
                : "Iniciar sesion para unirme"}
            <ArrowRight size={18} />
          </button>
        </div>

        {alreadyMember && (
          <p className="auth-footer">
            <Link to="/mis-ligas">Ir a Mis ligas</Link>
          </p>
        )}
      </div>
    </section>
  );
}
