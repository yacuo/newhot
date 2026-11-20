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
  // 已经是完整地址（例如指向资源站的 logo）就原样返回
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const baseUrl = getBaseUrl().replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}

export { siteConfig };
