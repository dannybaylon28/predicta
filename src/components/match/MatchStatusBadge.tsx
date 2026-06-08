import { useEffect, useState } from "react";
import type { Match } from "../../types";
import { getMatchStatusDisplay } from "../../utils/matchDisplay";

type MatchStatusBadgeProps = {
  match: Match;
};

export function MatchStatusBadge({ match }: MatchStatusBadgeProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const status = getMatchStatusDisplay(match, now);

  return (
    <span className={`status-dot ${status.variant}`}>
      {status.label}
      {status.countdown ? <small className="status-countdown">{status.countdown}</small> : null}
    </span>
  );
}
