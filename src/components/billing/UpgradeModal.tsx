import { Crown, X } from "lucide-react";
import { Link } from "react-router-dom";
import {
  FREE_LEAGUE_LIMIT,
  FREE_MEMBER_LIMIT,
  PREMIUM_PRICE_MXN,
  PREMIUM_PRICE_USD,
  type PlanLimitCode,
} from "../../constants/plan";

type UpgradeModalProps = {
  open: boolean;
  reason: PlanLimitCode;
  onClose: () => void;
};

const COPY: Record<PlanLimitCode, { title: string; body: string }> = {
  CREATE_LEAGUE_LIMIT: {
    title: "Necesitas Premium para otra liga",
    body: `El plan gratuito permite crear ${FREE_LEAGUE_LIMIT} liga por torneo. Premium desbloquea ligas ilimitadas para el Mundial 2026.`,
  },
  MEMBER_LIMIT: {
    title: "Tu liga llego al limite gratuito",
    body: `El plan gratuito admite hasta ${FREE_MEMBER_LIMIT} miembros por liga. Premium permite invitar a todo tu grupo sin tope.`,
  },
};

export function UpgradeModal({ open, reason, onClose }: UpgradeModalProps) {
  if (!open) return null;

  const content = COPY[reason];

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="upgrade-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="icon-button modal-close" type="button" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>

        <div className="upgrade-modal-icon">
          <Crown size={24} />
        </div>

        <p className="overline">Predicta Premium</p>
        <h2 id="upgrade-modal-title">{content.title}</h2>
        <p>{content.body}</p>

        <ul className="upgrade-modal-list">
          <li>Ligas ilimitadas en el torneo</li>
          <li>Miembros ilimitados en tus ligas</li>
          <li>Sin anuncios</li>
          <li>Vigente solo para este torneo (Mundial 2026)</li>
        </ul>

        <p className="upgrade-modal-price">
          Desde <strong>{PREMIUM_PRICE_MXN} MXN</strong> en Mexico · <strong>${PREMIUM_PRICE_USD} USD</strong> en
          el resto del mundo
        </p>

        <Link className="primary-button full" to="/premium" onClick={onClose}>
          Ver Premium y pagar
        </Link>
      </section>
    </div>
  );
}
