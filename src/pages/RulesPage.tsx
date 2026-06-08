import { BarChart3, Lock, ShieldCheck, Trophy } from "lucide-react";
import { Rule } from "../components/ui/Rule";
import { scoringLabels } from "../constants/scoring";
import { useLeague } from "../context/LeagueContext";

export function RulesPage() {
  const { selectedLeague } = useLeague();

  if (!selectedLeague) {
    return (
      <section className="content-page">
        <p className="page-copy">Selecciona o crea una liga para ver sus reglas.</p>
      </section>
    );
  }

  return (
    <section className="content-page rules-grid">
      <div>
        <p className="overline">Reglas activas</p>
        <h2>{selectedLeague.name}</h2>
        <p className="page-copy">
          Todo lo que necesitas saber antes de marcar: como se cierran los partidos, como suman
          los puntos y quien se lleva el premio.
        </p>
      </div>
      <div className="rule-stack">
        <Rule icon={<ShieldCheck size={21} />} title="Cierre automatico">
          Cada partido se bloquea al iniciar segun el horario oficial del Mundial. Nadie puede
          editar su prediccion tarde.
        </Rule>
        <Rule icon={<Trophy size={21} />} title="Premios configurables">
          La liga reparte premio entre {selectedLeague.winners} ganadores segun la clasificacion
          final.
        </Rule>
        <Rule icon={<BarChart3 size={21} />} title="Puntuacion">
          {scoringLabels[selectedLeague.scoringMode]}: {selectedLeague.resultPoints} puntos por
          resultado y {selectedLeague.exactBonus} de bonus por marcador exacto.
        </Rule>
        <Rule icon={<Lock size={21} />} title="Privacidad">
          Las ligas se unen por link, codigo o invitacion directa de usuario.
        </Rule>
      </div>
    </section>
  );
}
