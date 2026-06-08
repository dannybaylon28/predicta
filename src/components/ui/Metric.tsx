import type { ReactNode } from "react";

type MetricProps = {
  icon: ReactNode;
  label: string;
  value: ReactNode;
};

export function Metric({ icon, label, value }: MetricProps) {
  return (
    <article className="metric">
      <span className="metric-icon">{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
    </article>
  );
}
