import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getTournament } from "../constants/tournaments";
import { usePremium } from "../hooks/usePremium";
import { verifyCheckoutSession } from "../services/billing";

export function PremiumSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { tournamentId, refreshUsage } = usePremium();
  const tournament = getTournament(tournamentId);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    let cancelled = false;

    void verifyCheckoutSession(sessionId)
      .then(async (active) => {
        if (cancelled) return;
        if (active) {
          await refreshUsage();
          setStatus("success");
          return;
        }
        setStatus("error");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [refreshUsage, sessionId]);

  if (status === "loading") {
    return (
      <section className="premium-page premium-success">
        <LoaderCircle size={28} className="spin" />
        <h1>Confirmando tu pago...</h1>
        <p>Esto toma solo unos segundos.</p>
      </section>
    );
  }

  if (status === "error") {
    const retry = () => {
      if (!sessionId) return;
      setStatus("loading");
      void verifyCheckoutSession(sessionId)
        .then(async (active) => {
          if (active) {
            await refreshUsage();
            setStatus("success");
            return;
          }
          setStatus("error");
        })
        .catch(() => setStatus("error"));
    };

    return (
      <section className="premium-page premium-success">
        <h1>No pudimos confirmar el pago</h1>
        <p>Si ya pagaste, espera un minuto y vuelve a intentar. Tambien puedes escribir a hola@predictaclub.com</p>
        <div className="form-footer">
          {sessionId && (
            <button className="primary-button" type="button" onClick={retry}>
              Reintentar confirmacion
            </button>
          )}
          <Link className="secondary-button" to="/premium">
            Volver a Premium
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="premium-page premium-success">
      <CheckCircle2 size={40} />
      <h1>Premium activado</h1>
      <p>
        Ya puedes crear ligas ilimitadas y meter a todo tu grupo en {tournament.shortName}.
      </p>
      <Link className="primary-button" to="/crear">
        Crear otra liga
      </Link>
      <Link className="secondary-button" to="/mis-ligas">
        Ir a mis ligas
      </Link>
    </section>
  );
}
