import { appUrl } from "../constants/brand";

export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase();
}

export function buildJoinUrl(code: string): string {
  const normalized = normalizeInviteCode(code);
  return `${appUrl()}/unirse/${normalized}`;
}
