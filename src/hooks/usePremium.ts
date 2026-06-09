import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_TOURNAMENT_ID, FREE_LEAGUE_LIMIT, FREE_MEMBER_LIMIT } from "../constants/plan";
import { useAuth } from "../context/AuthContext";
import { useLeague } from "../context/LeagueContext";
import {
  countAdminLeagues,
  getTournamentUsage,
  hasPremium,
  isEntitlementActive,
  subscribeEntitlement,
} from "../services/entitlements";
import type { TournamentEntitlement } from "../types";
import { membersRemaining } from "../utils/planLimits";

export function usePremium(tournamentId = DEFAULT_TOURNAMENT_ID) {
  const { user } = useAuth();
  const { leagues } = useLeague();
  const [entitlement, setEntitlement] = useState<TournamentEntitlement | null>(null);
  const [leaguesCreated, setLeaguesCreated] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshUsage = useCallback(async () => {
    if (!user) {
      setLeaguesCreated(0);
      return;
    }
    const usage = await getTournamentUsage(user.uid, tournamentId);
    setLeaguesCreated(usage.leaguesCreated);
  }, [tournamentId, user]);

  useEffect(() => {
    if (!user) {
      setEntitlement(null);
      setLeaguesCreated(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    void refreshUsage().finally(() => setLoading(false));

    return subscribeEntitlement(user.uid, tournamentId, setEntitlement);
  }, [refreshUsage, tournamentId, user]);

  const isPremium = useMemo(() => isEntitlementActive(entitlement), [entitlement]);

  const adminLeagues = useMemo(() => {
    if (!user) return 0;
    return countAdminLeagues(leagues, user.uid, tournamentId);
  }, [leagues, tournamentId, user]);

  const canCreateLeague = isPremium || leaguesCreated < FREE_LEAGUE_LIMIT;
  const leaguesRemaining = isPremium ? null : Math.max(0, FREE_LEAGUE_LIMIT - leaguesCreated);

  return {
    tournamentId,
    isPremium,
    loading,
    entitlement,
    leaguesCreated,
    adminLeagues,
    canCreateLeague,
    leaguesRemaining,
    freeMemberLimit: FREE_MEMBER_LIMIT,
    refreshUsage,
    checkPremium: () => (user ? hasPremium(user.uid, tournamentId) : Promise.resolve(false)),
    membersRemainingForLeague: (memberCount: number) => membersRemaining(isPremium, memberCount),
  };
}
