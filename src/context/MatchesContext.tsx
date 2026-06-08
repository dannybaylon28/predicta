import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchWorldCupMatches } from "../services/worldCupApi";
import type { Match } from "../types";
import { getOpenMatches } from "../utils/matchStatus";

type MatchesContextValue = {
  matches: Match[];
  openMatches: Match[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
};

const MatchesContext = createContext<MatchesContextValue | null>(null);

export function MatchesProvider({ children }: { children: ReactNode }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMatches = useCallback(async (force = false) => {
    setLoading(true);
    setError("");

    try {
      const nextMatches = await fetchWorldCupMatches(force);
      setMatches(nextMatches);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar partidos.");
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  return (
    <MatchesContext.Provider
      value={{
        matches,
        openMatches: getOpenMatches(matches),
        loading,
        error,
        refresh: () => loadMatches(true),
      }}
    >
      {children}
    </MatchesContext.Provider>
  );
}

export function useMatches() {
  const context = useContext(MatchesContext);
  if (!context) {
    throw new Error("useMatches debe usarse dentro de MatchesProvider");
  }
  return context;
}
