import type { FeedMeta } from "@/modules/content";
import { companies, type Company } from "./model";

export type CompanySummary = {
  company: Company;
  articleCount: number;
  /** 模型发布类文章数，用于详情页时间轴与列表页标记 */
  releaseCount: number;
  channelCount: number;
  /** 覆盖的频道 id，用于卡片上的频道色点 */
  channels: string[];
  lastUpdated: string | null;
};

/** 按公司聚合文章统计；统计值来自构建期生成的 meta.json，不再扫描全量 feed */
export function buildCompanySummaries(stats: FeedMeta["companies"]): CompanySummary[] {
  return companies.map((company) => {
    const entry = stats[company.id];

    if (!entry) {
      return {
        company,
        articleCount: 0,
        releaseCount: 0,
        channelCount: 0,
        channels: [],
        lastUpdated: null,
      } satisfies CompanySummary;
    }

    return {
      company,
      articleCount: entry.count,
      releaseCount: entry.releaseCount,
      channelCount: entry.channels.length,
      channels: [...entry.channels],
      lastUpdated: entry.latest,
    } satisfies CompanySummary;
  });
}

export function sortByActivity(summaries: CompanySummary[]) {
  return [...summaries].sort(
    (a, b) =>
      Number(b.articleCount > 0) - Number(a.articleCount > 0) ||
      b.articleCount - a.articleCount ||
      (b.lastUpdated ?? "").localeCompare(a.lastUpdated ?? "") ||
      a.company.name.localeCompare(b.company.name, "zh-Hans-CN"),
  );
}
