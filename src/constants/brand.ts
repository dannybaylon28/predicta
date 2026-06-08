export const APP_NAME = "Predicta";
export const APP_DOMAIN = "predictaclub.com";
export const APP_TAGLINE = "Quiniela Mundial 2026";
export const DEFAULT_PAGE_TITLE = `${APP_NAME} | ${APP_TAGLINE}`;
export const DEFAULT_DESCRIPTION = `${APP_NAME}, quinielas privadas y personalizables para el Mundial 2026.`;

export function appUrl(): string {
  const configured = import.meta.env.VITE_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return `https://${APP_DOMAIN}`;
}

export const APP_URL = `https://${APP_DOMAIN}`;
