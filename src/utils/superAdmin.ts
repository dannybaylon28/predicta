import { SUPER_ADMIN_UID } from "../constants/superAdmin";

export function isSuperAdmin(userId: string | undefined | null): boolean {
  return Boolean(userId && userId === SUPER_ADMIN_UID);
}
