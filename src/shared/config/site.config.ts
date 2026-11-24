import { readConfigJson } from "./read-config";
import { formatConfigError, siteConfigSchema } from "./schemas";

export type SiteIcons = {
  ico: string;
  svg: string;
  png48: string;
  png96: string;
  png192: string;
  appleTouch: string;
};

export type SiteConfig = {
  name: string;
  /** 品牌词的可拆分写法，用于 Logo 排版；默认取 name */
  wordmark: string[];
  url: string;
  description: string;
  ogImage: string;
  logo: string;
  /** 站点图标；留空则不输出对应 link */
  icons: SiteIcons;
  author: string;
  language: string;
  repository: string;
  copyright: string;
  /** Agent API / MCP / Skill 文档使用的服务地址；留空则回退到站点地址 */
  apiBaseUrl: string;
  /** Agent Skill 的名称与目录名 */
  skillName: string;
};

const DEFAULTS: SiteConfig = {
  name: "NewHot",
  wordmark: ["New", "Hot"],
  url: "https://newhot.org",
  description:
    "AI 大模型新闻与厂商动态，按发布时间整理官方公告与文档：模型发布、API 价格、AI 编程、AI 办公、AI 创作与故障排查。",
  ogImage: "/og/article-default.png",
  logo: "/logo.png",
  icons: {
    ico: "/favicon.ico",
    svg: "/favicon.svg",
    png48: "/favicon-48.png",
    png96: "/favicon-96.png",
    png192: "/favicon-192.png",
    appleTouch: "/apple-touch-icon.png",
  },
  author: "NewHot",
  language: "zh-CN",
  repository: "https://github.com/yacuo/newhot",
  copyright: "Copyright © NewHot. All rights reserved.",
  apiBaseUrl: "",
  skillName: "newhot",
};

/** 站点品牌与地址来自内容项目的 config/global/site.json，换站只改内容，不改代码。 */
function readSiteConfig(): SiteConfig {
  const parsed = siteConfigSchema.safeParse(readConfigJson("global/site.json"));

  if (!parsed.success) {
    throw new Error(formatConfigError(parsed.error, "config/global/site.json"));
  }

  const raw = parsed.data;
  const name = raw.name || DEFAULTS.name;

  return {
    ...DEFAULTS,
    ...raw,
    name,
    wordmark:
      Array.isArray(raw.wordmark) && raw.wordmark.length > 0
        ? raw.wordmark
        : [name],
    icons: { ...DEFAULTS.icons, ...(raw.icons ?? {}) },
  };
}

export const siteConfig = readSiteConfig();

/** Agent API 服务基址；可用 API_BASE_URL 覆盖。 */
export function getApiBaseUrl(): string {
  const base = process.env.API_BASE_URL || siteConfig.apiBaseUrl || siteConfig.url;
  return base.replace(/\/+$/, "");
}
