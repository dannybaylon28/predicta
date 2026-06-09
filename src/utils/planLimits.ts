import {
  FREE_LEAGUE_LIMIT,
  FREE_MEMBER_LIMIT,
  PlanLimitError,
} from "../constants/plan";

export function assertCanCreateLeague(isPremium: boolean, leaguesCreated: number): void {
  if (isPremium || leaguesCreated < FREE_LEAGUE_LIMIT) return;

  throw new PlanLimitError(
    "CREATE_LEAGUE_LIMIT",
    "El plan gratuito permite crear 1 liga por torneo. Actualiza a Premium para crear mas ligas.",
  );
}

export function assertCanAddMember(isPremium: boolean, currentMemberCount: number): void {
  if (isPremium || currentMemberCount < FREE_MEMBER_LIMIT) return;

  throw new PlanLimitError(
    "MEMBER_LIMIT",
    `Esta liga alcanzo el limite de ${FREE_MEMBER_LIMIT} miembros del plan gratuito. El administrador puede actualizar a Premium.`,
  );
}

export function membersRemaining(isPremium: boolean, currentMemberCount: number): number | null {
  if (isPremium) return null;
  return Math.max(0, FREE_MEMBER_LIMIT - currentMemberCount);
}
