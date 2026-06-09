import { Check, Crown, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FREE_LEAGUE_LIMIT,
  FREE_MEMBER_LIMIT,
  PREMIUM_PRICE_MXN,
  PREMIUM_PRICE_USD,
} from "../constants/plan";
import { getTournament } from "../constants/tournaments";
import { useAuth } from "../context/AuthContext";
import { usePremium } from "../hooks/usePremium";
import { detectBillingRegion, startPremiumCheckout } from "../services/billing";

export function PremiumPage() {
  const { user } = useAuth();
  const { isPremium, loading, tournamentId } = usePremium();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const tournament = getTournament(tournamentId);
  const region = detectBillingRegion();
  const priceLabel = region === "mx" ? `${PREMIUM_PRICE_MXN} MXN` : `$${PREMIUM_PRICE_USD} USD`;
  const cancelled = searchParams.get("cancelled") === "1";

  const handleCheckout = async () => {
    setError("");
    setSubmitting(true);

    try {
      await startPremiumCheckout(tournamentId, region);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos iniciar el pago.");
      setSubmitting(false);
    }
  };

  return (
    <section className="premium-page">
      <div className="premium-hero">
        <div className="upgrade-modal-icon premium-hero-icon">
          <Crown size={28} />
        </div>
        <p className="overline">Planes</p>
        <h1>Predicta Premium</h1>
        <p className="premium-subtitle">
          Organiza quinielas grandes para {tournament.shortName}. Paga una vez por torneo; el resto de tu grupo entra
          gratis.
        </p>
      </div>

      {cancelled && <p className="panel-status">Pago cancelado. Puedes intentarlo cuando quieras.</p>}

      <div className="premium-grid">
        <article className="plan-card">
          <p className="plan-label">Free</p>
          <h2>$0</h2>
          <ul>
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
        </article>

        <article className="plan-card plan-card-featured">
          <p className="plan-label">Premium</p>
          <h2>{priceLabel}</h2>
          <p className="plan-note">Pago unico por {tournament.shortName}</p>
          <ul>
            <li>
              <Check size={16} /> Ligas ilimitadas en el torneo
            </li>
            <li>
              <Check size={16} /> Miembros ilimitados en tus ligas
            </li>
            <li>
              <Check size={16} /> Sin anuncios
            </li>
            <li>
              <Check size={16} /> Solo paga quien administra
            </li>
          </ul>

          {loading ? (
            <p className="panel-status">
              <LoaderCircle size={16} className="spin" /> Verificando tu plan...
            </p>
          ) : isPremium ? (
            <p className="plan-active-badge">Ya tienes Premium activo para {tournament.shortName}</p>
          ) : user ? (
            <>
              {error && <p className="auth-error">{error}</p>}
              <button className="primary-button full" type="button" onClick={handleCheckout} disabled={submitting}>
                {submitting ? "Redirigiendo a Stripe..." : `Pagar ${priceLabel}`}
              </button>
            </>
          ) : (
            <Link className="primary-button full" to="/entrar">
              Inicia sesion para pagar
            </Link>
          )}
        </article>
      </div>

      <p className="premium-footnote">
        El proximo torneo (por ejemplo Mundial 2030 o NFL) requerira un nuevo pago. Precio internacional:{" "}
        <strong>${PREMIUM_PRICE_USD} USD</strong>. Mexico: <strong>{PREMIUM_PRICE_MXN} MXN</strong>.
      </p>
    </section>
  );
}
