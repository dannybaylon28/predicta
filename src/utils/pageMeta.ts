import { APP_URL, DEFAULT_DESCRIPTION, DEFAULT_PAGE_TITLE } from "../constants/brand";

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  const selector = `meta[${attribute}="${key}"]`;
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

export type PageMetaInput = {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
};

export function setPageMeta(meta: PageMetaInput) {
  if (meta.title) document.title = meta.title;
  if (meta.description) upsertMeta("name", "description", meta.description);
  if (meta.ogTitle) upsertMeta("property", "og:title", meta.ogTitle);
  if (meta.ogDescription) upsertMeta("property", "og:description", meta.ogDescription);
  if (meta.ogUrl) upsertMeta("property", "og:url", meta.ogUrl);
}

export function resetPageMeta() {
  document.title = DEFAULT_PAGE_TITLE;
  upsertMeta("name", "description", DEFAULT_DESCRIPTION);
  upsertMeta("property", "og:title", DEFAULT_PAGE_TITLE);
  upsertMeta("property", "og:description", DEFAULT_DESCRIPTION);
  upsertMeta("property", "og:url", APP_URL);
}
