import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { createLeague, joinLeague, listMyLeagues } from "../services/leagues";
import type { LeagueRecord, ScoringMode } from "../types";
import { useAuth } from "./AuthContext";

export type LeagueDraft = {
  name: string;
  prize: string;
  winners: number;
  scoringMode: ScoringMode;
  resultPoints: number;
  exactBonus: number;
};

type LeagueContextValue = {
  leagues: LeagueRecord[];
  selectedLeagueId: string | null;
  setSelectedLeagueId: (id: string) => void;
  selectedLeague: LeagueRecord | null;
  leagueDraft: LeagueDraft;
  setLeagueDraft: (draft: LeagueDraft) => void;
  loading: boolean;
  saving: boolean;
  loadError: string;
  saveError: string;
  joining: boolean;
  joinError: string;
  refreshLeagues: () => Promise<void>;
  saveLeague: () => Promise<LeagueRecord>;
  joinLeagueByCode: (code: string) => Promise<LeagueRecord>;
  clearSaveError: () => void;
  clearJoinError: () => void;
};

const LeagueContext = createContext<LeagueContextValue | null>(null);

const defaultDraft: LeagueDraft = {
  name: "Mundial entre amigos",
  prize: "$10,000 MXN",
  winners: 3,
  scoringMode: "hybrid",
  resultPoints: 3,
  exactBonus: 2,
};

export function LeagueProvider({ children }: { children: ReactNode }) {
  const { user, profile, loading: authLoading } = useAuth();
  const [leagues, setLeagues] = useState<LeagueRecord[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [leagueDraft, setLeagueDraft] = useState<LeagueDraft>(defaultDraft);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  const refreshLeagues = useCallback(async () => {
    if (!user) {
      setLeagues([]);
      setSelectedLeagueId(null);
      return;
    }

    setLoading(true);
    setLoadError("");

    try {
      const nextLeagues = await listMyLeagues(user.uid);
      setLeagues(nextLeagues);
      setSelectedLeagueId((current) => {
        if (current && nextLeagues.some((league) => league.id === current)) return current;
        return nextLeagues[0]?.id ?? null;
      });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No pudimos cargar tus ligas.");
      setLeagues([]);
      setSelectedLeagueId(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void refreshLeagues();
  }, [authLoading, refreshLeagues]);

  const saveLeague = useCallback(async () => {
    if (!user) throw new Error("Debes iniciar sesion para crear una liga.");

    const displayName =
      profile?.displayName || user.displayName || user.email?.split("@")[0] || "Jugador";

    setSaving(true);
    setSaveError("");

    try {
      const created = await createLeague(leagueDraft, { uid: user.uid, displayName });
      setLeagues((current) => {
        const withoutDuplicate = current.filter((league) => league.id !== created.id);
        return [...withoutDuplicate, created].sort((a, b) => a.name.localeCompare(b.name, "es"));
      });
      setSelectedLeagueId(created.id);
      void refreshLeagues();
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : "No pudimos crear la liga.";
      setSaveError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, [leagueDraft, profile?.displayName, refreshLeagues, user]);

  const joinLeagueByCode = useCallback(
    async (code: string) => {
      if (!user) throw new Error("Debes iniciar sesion para unirte a una liga.");

      const displayName =
        profile?.displayName || user.displayName || user.email?.split("@")[0] || "Jugador";

      setJoining(true);
      setJoinError("");

      try {
        const joined = await joinLeague(code, { uid: user.uid, displayName });
        setLeagues((current) => {
          const withoutDuplicate = current.filter((league) => league.id !== joined.id);
          return [...withoutDuplicate, joined].sort((a, b) => a.name.localeCompare(b.name, "es"));
        });
        setSelectedLeagueId(joined.id);
        void refreshLeagues();
        return joined;
      } catch (err) {
        const message = err instanceof Error ? err.message : "No pudimos unirte a la liga.";
        setJoinError(message);
        throw new Error(message);
      } finally {
        setJoining(false);
      }
    },
    [profile?.displayName, refreshLeagues, user],
  );

  const selectedLeague = leagues.find((league) => league.id === selectedLeagueId) ?? null;

  return (
    <LeagueContext.Provider
      value={{
        leagues,
        selectedLeagueId,
        setSelectedLeagueId,
        selectedLeague,
        leagueDraft,
        setLeagueDraft,
        loading,
        saving,
        loadError,
        saveError,
        joining,
        joinError,
        refreshLeagues,
        saveLeague,
        joinLeagueByCode,
        clearSaveError: () => setSaveError(""),
        clearJoinError: () => setJoinError(""),
      }}
    >
      {children}
    </LeagueContext.Provider>
  );
}

export function useLeague() {
  const context = useContext(LeagueContext);
  if (!context) {
    throw new Error("useLeague debe usarse dentro de LeagueProvider");
  }
  return context;
}
