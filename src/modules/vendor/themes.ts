import { readVendorJson } from "./data";
import type { FeedMeta } from "@/modules/content";
import { buildCompanySummaries, sortByActivity, type CompanySummary } from "./summary";

export type ThemeGroup = {
  id: string;
  label: string;
  companyIds: string[];
};

export type VendorTheme = {
  id: string;
  name: string;
  eyebrow: string;
  description: string;
  groups: ThemeGroup[];
};

/** 主题只做公司卡片聚合：一个公司可以出现在多个主题里，主主题是声明顺序里的第一个 */
export const themes = readVendorJson<{ themes: VendorTheme[] }>("themes.json").themes;

const byId = new Map(themes.map((theme) => [theme.id, theme]));

export function getTheme(id?: string | null) {
  return id ? byId.get(id) ?? null : null;
}

const themeSeo = readVendorJson<{
  themes: Record<string, { title: string; description: string } | undefined>;
}>("theme-seo.json").themes;

/** 主题列表页的独立 SEO 文案；每个主题都必须在 theme-seo.json 中有配置，缺失直接报错 */
export function getThemeSeo(theme: VendorTheme) {
  const seo = themeSeo[theme.id];

  if (!seo) {
    throw new Error(`缺少主题 SEO 配置：data/vendors/theme-seo.json 未包含 ${theme.id}`);
  }

  return seo;
}

export function themeHref(id: string) {
  return `/themes/${id}/`;
}

/** 主题内的公司 id：按分组顺序去重，未知 id 直接跳过 */
export function getThemeCompanyIds(theme: VendorTheme) {
  const ids = new Set<string>();

  for (const group of theme.groups) {
    for (const id of group.companyIds) {
      ids.add(id);
    }
  }

  return [...ids];
}

export function getCompanyThemes(companyId: string) {
  return themes.filter((theme) => theme.groups.some((group) => group.companyIds.includes(companyId)));
}

export function getPrimaryTheme(companyId: string) {
  return getCompanyThemes(companyId)[0] ?? null;
}

export type ThemeStat = {
  theme: VendorTheme;
  /** 主题下公司总数 */
  companyCount: number;
  /** 主题下已收录动态的公司数 */
  activeCompanyCount: number;
  articleCount: number;
  latest: string | null;
};

export function buildThemeStat(theme: VendorTheme, stats: FeedMeta["companies"]): ThemeStat {
  const byCompany = new Map(buildCompanySummaries(stats).map((summary) => [summary.company.id, summary]));
  const summaries = getThemeCompanyIds(theme)
    .map((id) => byCompany.get(id))
    .filter((summary): summary is CompanySummary => Boolean(summary));

  let articleCount = 0;
  let activeCompanyCount = 0;
  let latest: string | null = null;

  for (const summary of summaries) {
    articleCount += summary.articleCount;

    if (summary.articleCount > 0) {
      activeCompanyCount += 1;
    }

    if (summary.lastUpdated && (!latest || summary.lastUpdated > latest)) {
      latest = summary.lastUpdated;
    }
  }

  return {
    theme,
    companyCount: summaries.length,
    activeCompanyCount,
    articleCount,
    latest,
  };
}

export type ThemeSection = {
  id: string;
  label: string;
  summaries: CompanySummary[];
};

export type ThemeListing = {
  summaries: CompanySummary[];
  sections: ThemeSection[];
};

/** 主题页数据：分组内按活跃度排序，未归组的公司兜底到「其他」 */
export function buildThemeListing(theme: VendorTheme, stats: FeedMeta["companies"]): ThemeListing {
  const byCompany = new Map(buildCompanySummaries(stats).map((summary) => [summary.company.id, summary]));
  const grouped = new Set<string>();

  const sections = theme.groups
    .map((group) => {
      const summaries = group.companyIds
        .filter((id) => {
          if (grouped.has(id)) return false;

          grouped.add(id);

          return true;
        })
        .map((id) => byCompany.get(id))
        .filter((summary): summary is CompanySummary => Boolean(summary));

      return { id: group.id, label: group.label, summaries: sortByActivity(summaries) };
    })
    .filter((section) => section.summaries.length > 0);

  const rest = getThemeCompanyIds(theme)
    .filter((id) => !grouped.has(id))
    .map((id) => byCompany.get(id))
    .filter((summary): summary is CompanySummary => Boolean(summary));

  if (rest.length > 0) {
    sections.push({ id: "other", label: "其他公司", summaries: sortByActivity(rest) });
  }

  return {
    summaries: sortByActivity(sections.flatMap((section) => section.summaries)),
    sections,
  };
}
