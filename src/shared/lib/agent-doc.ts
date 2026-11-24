import { getApiBaseUrl, getSiteUrl, siteConfig } from "../config/site";

/** Agent 文档里的站点品牌、域名与 Skill 名都来自站点配置。 */
export function renderAgentDoc(text: string): string {
  const siteUrl = getSiteUrl("").replace(/\/$/, "");
  const host = new URL(siteUrl).host;

  return text
    .replaceAll("{{siteUrl}}", siteUrl)
    .replaceAll("{{apiBase}}", getApiBaseUrl())
    .replaceAll("{{host}}", host)
    .replaceAll("{{brand}}", siteConfig.name)
    .replaceAll("{{repo}}", siteConfig.repository)
    .replaceAll("{{skillName}}", siteConfig.skillName);
}
