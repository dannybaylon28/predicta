import { ACTIVE_TOURNAMENT_ID } from "./tournaments";

export const FREE_LEAGUE_LIMIT = 1;
export const FREE_MEMBER_LIMIT = 10;

export const PREMIUM_PRICE_MXN = 129;
export const PREMIUM_PRICE_USD = 5;

export const PREMIUM_AMOUNT_MXN_CENTS = PREMIUM_PRICE_MXN * 100;
export const PREMIUM_AMOUNT_USD_CENTS = PREMIUM_PRICE_USD * 100;

export const DEFAULT_TOURNAMENT_ID = ACTIVE_TOURNAMENT_ID;

export type PlanLimitCode = "CREATE_LEAGUE_LIMIT" | "MEMBER_LIMIT";

export class PlanLimitError extends Error {
  readonly code: PlanLimitCode;

  constructor(code: PlanLimitCode, message: string) {
    super(message);
    this.name = "PlanLimitError";
    this.code = code;
  }
}
