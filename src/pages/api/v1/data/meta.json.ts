import type { APIRoute } from "astro";
import {
  buildArticleIndex,
  buildChannelIndex,
  buildSubcategoryIndex,
  buildTagIndex,
  buildThemeIndex,
  buildTypeIndex,
  buildVendorIndex,
} from "@/shared/api/dataset";
import { internalJson } from "@/shared/api/internal";

/** 接口元信息：各维度总数与文章类型枚举，限流规则由 Worker 补齐 */
export const GET: APIRoute = async () => {
  const [articles, subcategories, vendors, themeIndex, tags, types] = await Promise.all([
    buildArticleIndex(),
    buildSubcategoryIndex(),
    buildVendorIndex(),
    buildThemeIndex(),
    buildTagIndex(),
    buildTypeIndex(),
  ]);
  const { channels } = buildChannelIndex();

  return internalJson({
    generatedAt: articles.generatedAt,
    counts: {
      articles: articles.total,
      channels: channels.length,
      subcategories: subcategories.subcategories.length,
      companies: vendors.companies.length,
      themes: themeIndex.themes.length,
      tags: tags.tags.length,
    },
    types,
  });
};
