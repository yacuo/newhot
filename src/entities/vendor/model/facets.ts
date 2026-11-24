import type { ArticleListItem } from "@/entities/article/model";
import { getTopicAccent } from "@/entities/channel/model/accents";
import { getCompany, resolveProduct, type Company } from "./model";

export type ChannelFacet = {
  id: string;
  label: string;
  count: number;
  text: string;
  dot: string;
};

export type ProductFacet = {
  id: string;
  name: string;
  count: number;
};

/**
 * 公司详情页的分面。
 *
 * 两个维度都从文章里现算，不写死：
 * - 频道：这家公司实际覆盖了哪些频道（腾讯不会有「编程工具」）
 * - 产品：文章实际命中了哪些产品（OpenAI 会有 GPT、Codex、Sora）
 * 只返回有内容的选项，数量为 1 的维度不展示，避免出现只有一个按钮的假筛选。
 */
export function buildChannelFacets(items: ArticleListItem[]): ChannelFacet[] {
  const counts = new Map<string, { count: number; label?: string }>();

  for (const item of items) {
    const entry = counts.get(item.category) ?? { count: 0, label: item.categoryLabel };
    entry.count += 1;
    counts.set(item.category, entry);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .map(([id, entry]) => ({
      id,
      label: entry.label ?? id,
      count: entry.count,
      text: getTopicAccent(id).text,
      dot: getTopicAccent(id).dot,
    }));
}

/**
 * 产品归属按文章自己的公司算：母公司页面会收进子公司文章，
 * 必须用子公司自己的产品表，否则 TRAE 的国际版/中国版对不上字节跳动的产品。
 */
function articleCompanyOf(company: Company, item: ArticleListItem) {
  return (item.company && item.company !== company.id ? getCompany(item.company) : null) ?? company;
}

function productKey(owner: Company, productId: string) {
  return `${owner.id}:${productId}`;
}

export function buildProductFacets(company: Company, items: ArticleListItem[]): ProductFacet[] {
  const counts = new Map<string, { name: string; count: number; order: number }>();

  for (const item of items) {
    const owner = articleCompanyOf(company, item);
    const product = resolveProduct(owner, item.tags, item.title);

    if (!product) continue;

    const id = productKey(owner, product.id);
    // 数量相同时按产品声明顺序排，版本切换这类选项不会随文章日期抖动
    const entry = counts.get(id) ?? {
      // 子公司产品在母公司页面加上前缀，避免和母公司产品重名（如「国际版」「中国版」）
      name: owner.id === company.id ? product.name : `${owner.name} ${product.name}`,
      count: 0,
      order: owner.products.findIndex((candidate) => candidate.id === product.id),
    };
    entry.count += 1;
    counts.set(id, entry);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count || a[1].order - b[1].order)
    .map(([id, entry]) => ({ id, name: entry.name, count: entry.count }));
}

/** 一次算好每篇文章的产品归属，避免筛选时重复匹配 */
export function mapProductIds(company: Company, items: ArticleListItem[]) {
  const map = new Map<string, string>();

  for (const item of items) {
    const owner = articleCompanyOf(company, item);
    const product = resolveProduct(owner, item.tags, item.title);

    if (product) map.set(item.href, productKey(owner, product.id));
  }

  return map;
}
