import { siteConfig } from "../config/site.config";

export function getBaseUrl() {
  if (process.env.SITE_URL) {
    return process.env.SITE_URL;
  }

  if (process.env.NODE_ENV === "development") {
    return `http://localhost:${process.env.PORT || "3618"}/`;
  }

  return siteConfig.url;
}

export function getSiteUrl(path = "") {
  const baseUrl = getBaseUrl().replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}

export { siteConfig };
