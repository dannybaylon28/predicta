import { ArrowRight, Check, Copy, Crown, LoaderCircle, UserRound } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  FREE_LEAGUE_LIMIT,
  FREE_MEMBER_LIMIT,
  PREMIUM_PRICE_MXN,
  PREMIUM_PRICE_USD,
} from "../constants/plan";
import { getTournament } from "../constants/tournaments";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { usePremium } from "../hooks/usePremium";
import { changePassword, usesPasswordProvider } from "../services/auth";
import { detectBillingRegion, startPremiumCheckout } from "../services/billing";
import { updateUserDisplayName } from "../services/users";

export function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const handleCopyUid = () => {
    if (user?.uid) {
      void navigator.clipboard.writeText(user.uid);
      showToast("ID de usuario copiado al portapapeles.");
    }
  };
  const {
    isPremium,
    loading: planLoading,
    leaguesCreated,
    leaguesRemaining,
    tournamentId,
    entitlement,
  } = usePremium();

  const [displayName, setDisplayName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const tournament = getTournament(tournamentId);
  const region = detectBillingRegion();
  const priceLabel = region === "mx" ? `${PREMIUM_PRICE_MXN} MXN` : `$${PREMIUM_PRICE_USD} USD`;
  const canChangePassword = user ? usesPasswordProvider(user) : false;
  const providerLabel = user?.providerData.some((p) => p.providerId === "google.com")
    ? "Google"
    : "Correo y contraseña";

  useEffect(() => {
    setDisplayName(profile?.displayName || user?.displayName || "");
  }, [profile?.displayName, user?.displayName]);

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setProfileError("");
    setProfileMessage("");
    setProfileSaving(true);

    try {
      await updateUserDisplayName(displayName);
      await refreshProfile();
      setProfileMessage("Nombre actualizado.");
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "No pudimos guardar los cambios.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setPasswordSaving(true);

    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Contraseña actualizada correctamente.");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "No pudimos cambiar la contraseña.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleUpgrade = async () => {
    setCheckoutError("");
    setCheckoutSubmitting(true);

    try {
      await startPremiumCheckout(tournamentId, region);
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "No pudimos iniciar el pago.");
      setCheckoutSubmitting(false);
    }
  };

  return (
    <section className="profile-page">
      <header className="profile-header">
        <div className="profile-avatar" aria-hidden>
          <UserRound size={28} />
        </div>
        <div>
          <div className="profile-title-row">
            <p className="overline">Mi cuenta</p>
            {user?.email && (
              <span className="profile-header-user-tag">
                @{user.email.split("@")[0]}
              </span>
            )}
          </div>
          <h1>{profile?.displayName || user?.displayName || "Perfil"}</h1>
          <p className="profile-subtitle">
            Administra tu informacion, seguridad y plan de Predicta.
          </p>
        </div>
      </header>

      <div className="profile-grid">
        <article className="profile-card">
          <h2>Informacion personal</h2>
          <form className="profile-form" onSubmit={handleProfileSubmit}>
            <label>
              Nombre visible
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                autoComplete="name"
                required
              />
            </label>
            <label>
              Correo
              <input value={user?.email ?? ""} readOnly disabled />
            </label>
            <label>
              ID de usuario
              <div className="profile-uid-wrapper">
                <input value={user?.uid ?? ""} readOnly disabled className="profile-uid-input" />
                <button
                  type="button"
                  onClick={handleCopyUid}
                  className="profile-uid-copy-btn"
                  title="Copiar ID de usuario"
                >
                  <Copy size={16} />
                </button>
              </div>
            </label>
            <p className="profile-meta">
              Inicio de sesion con <strong>{providerLabel}</strong>
            </p>
            {profileError && <p className="auth-error">{profileError}</p>}
            {profileMessage && <p className="profile-success">{profileMessage}</p>}
            <button className="primary-button" type="submit" disabled={profileSaving}>
              {profileSaving ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        </article>

        <article className="profile-card">
          <h2>Seguridad</h2>
          {canChangePassword ? (
            <form className="profile-form" onSubmit={handlePasswordSubmit}>
              <label>
                Contraseña actual
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>
              <label>
                Nueva contraseña
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </label>
              <label>
                Confirmar nueva contraseña
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </label>
              {passwordError && <p className="auth-error">{passwordError}</p>}
              {passwordMessage && <p className="profile-success">{passwordMessage}</p>}
              <button className="secondary-button" type="submit" disabled={passwordSaving}>
                {passwordSaving ? "Actualizando..." : "Cambiar contraseña"}
              </button>
            </form>
          ) : (
            <p className="profile-note">
              Tu cuenta usa Google. Para cambiar la contraseña, hazlo desde la configuracion de tu
              cuenta de Google.
            </p>
          )}
        </article>

        <article className="profile-card profile-card-plan">
          <div className="profile-plan-head">
            <h2>Plan</h2>
            {isPremium ? (
              <span className="plan-badge plan-badge-premium">
                <Crown size={14} />
                Premium
              </span>
            ) : (
              <span className="plan-badge">Gratuito</span>
            )}
          </div>

          {planLoading ? (
            <p className="profile-loading">
              <LoaderCircle size={18} className="spin" /> Cargando plan...
            </p>
          ) : isPremium ? (
            <div className="profile-plan-body">
              <p>
                Tienes <strong>Premium</strong> activo para {tournament.shortName}.
              </p>
              <ul className="profile-plan-list">
                <li>
                  <Check size={16} /> Ligas ilimitadas en el torneo
                </li>
                <li>
                  <Check size={16} /> Miembros ilimitados en tus ligas
                </li>
              </ul>
              {entitlement?.purchasedAt && (
                <p className="profile-meta">
                  Activado el{" "}
                  {new Date(entitlement.purchasedAt).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          ) : (
            <div className="profile-plan-body">
              <p>
                Plan gratuito para {tournament.shortName}: puedes crear{" "}
                <strong>{FREE_LEAGUE_LIMIT}</strong> liga por torneo y tener hasta{" "}
                <strong>{FREE_MEMBER_LIMIT}</strong> miembros en las ligas que administras.
              </p>
              <p className="profile-meta">
                Ligas creadas: <strong>{leaguesCreated}</strong>
                {leaguesRemaining !== null && (
                  <>
                    {" "}
                    · Restantes: <strong>{leaguesRemaining}</strong>
                  </>
                )}
              </p>
              <ul className="profile-plan-list">
                <li>
                  <Check size={16} /> Unirse a ligas ilimitadas
                </li>
                <li>
                  <Check size={16} /> Crear {FREE_LEAGUE_LIMIT} liga por torneo
                </li>
                <li>
                  <Check size={16} /> Hasta {FREE_MEMBER_LIMIT} miembros en tus ligas
                </li>
              </ul>
              <p className="profile-upgrade-copy">
                Premium por <strong>{priceLabel}</strong> (pago unico por torneo): ligas y miembros
                ilimitados.
              </p>
              {checkoutError && <p className="auth-error">{checkoutError}</p>}
              <div className="profile-plan-actions">
                <button
                  className="primary-button"
                  type="button"
                  onClick={handleUpgrade}
                  disabled={checkoutSubmitting}
                >
                  {checkoutSubmitting ? "Redirigiendo..." : "Hacer upgrade"}
                  <ArrowRight size={18} />
                </button>
                <Link className="ghost-link" to="/premium">
                  Ver detalles del plan
                </Link>
              </div>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
