import type { Advancer } from "../../types";

type AdvanceSelectorProps = {
  homeTeam: string;
  awayTeam: string;
  value: Advancer | null;
  onChange: (advancer: Advancer) => void;
  disabled?: boolean;
};

export function AdvanceSelector({
  homeTeam,
  awayTeam,
  value,
  onChange,
  disabled = false,
}: AdvanceSelectorProps) {
  return (
    <div className="advance-selector">
      <span className="advance-selector-label">¿Quién avanza? (tiempo extra o penales)</span>
      <div className="advance-options" role="group" aria-label="Equipo que avanza">
        <button
          type="button"
          className={`advance-option${value === "home" ? " active" : ""}`}
          aria-pressed={value === "home"}
          onClick={() => onChange("home")}
          disabled={disabled}
        >
          {homeTeam}
        </button>
        <button
          type="button"
          className={`advance-option${value === "away" ? " active" : ""}`}
          aria-pressed={value === "away"}
          onClick={() => onChange("away")}
          disabled={disabled}
        >
          {awayTeam}
        </button>
      </div>
    </div>
  );
}
