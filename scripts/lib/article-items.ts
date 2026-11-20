import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { DATA_DIR } from "@/modules/content/paths";
import type { ContentTypeId } from "@/modules/content/content-types";
import type { ArticleListItem } from "@/modules/content/schema";
import { getChannels } from "@/modules/channel/model";
import { resolveCompany, getCompany, getCompanyModel, resolveProduct } from "@/modules/vendor";

const rootDir = process.cwd();
const contentDir = DATA_DIR;
const tutorialsRoot = path.join(contentDir, "tutorials");
// 更新日志是独立栏目，不参与文章 feed / 列表分片
const updateLogRoot = path.join(contentDir, "update-log");
const contentTypeConfig = JSON.parse(
  fs.readFileSync(path.join(rootDir, "src", "schema", "content-types.json"), "utf8"),
) as { types: { id: string }[]; defaults: Record<string, string> };
const channelLabels = new Map(getChannels().map((channel) => [channel.id, channel.label]));
const subcategoryLabels = new Map(
  getChannels().flatMap((channel) =>
    channel.subcategories.map((subcategory) => [`${channel.id}/${subcategory.id}`, subcategory.label] as const),
  ),
);

function getMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (fullPath === tutorialsRoot || fullPath === updateLogRoot) return [];
      return getMarkdownFiles(fullPath);
    }

    return entry.isFile() && entry.name.endsWith(".md") ? [fullPath] : [];
  });
}

function estimateReadingTime(content: string) {
  const chineseChars = content.match(/[\u4e00-\u9fa5]/g)?.length ?? 0;
  const latinWords = content.match(/[a-zA-Z0-9]+/g)?.length ?? 0;

  return Math.max(1, Math.ceil((chineseChars + latinWords) / 500));
}

function normalizeDateValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return null;
}

/** 统一成 YYYY-MM-DD；fetchedAt 这类带时间的字符串只取日期 */
function normalizeDayValue(value: unknown) {
  const normalized = normalizeDateValue(value);
  return normalized ? normalized.slice(0, 10) : null;
}

function resolveContentType(meta: Record<string, unknown>, sourcePath: string): ContentTypeId {
  if (typeof meta.type === "string" && contentTypeConfig.types.some((entry) => entry.id === meta.type)) {
    return meta.type as ContentTypeId;
  }

  const fallback = contentTypeConfig.defaults[`${String(meta.category)}/${String(meta.subcategory)}`];

  if (!fallback) {
    throw new Error(`${sourcePath}: 无法确定内容类型，请设置 type`);
  }

  return fallback as ContentTypeId;
}

function normalizePost(meta: Record<string, unknown>, content: string, sourcePath: string): ArticleListItem {
  const date = normalizeDateValue(meta.date);

  if (!date) {
    throw new Error(`${sourcePath}: 文章必须设置 date`);
  }

  /** 站内发布日期：只认 AI 写稿当天写入的 publishedAt，原文 date 不得拿来当发布时间 */
  const publishedAt = normalizeDayValue(meta.publishedAt);

  if (!publishedAt) {
    throw new Error(`${sourcePath}: 文章必须设置 publishedAt（AI 写稿当天日期）`);
  }

  if (typeof meta.subcategory !== "string" || !meta.subcategory) {
    throw new Error(`${sourcePath}: 文章必须设置 subcategory，用于生成 /{二级分类}/{slug}/ 路径`);
  }

  const tags = Array.isArray(meta.tags) ? meta.tags.map(String) : [];
  // frontmatter 已带 company 时直接使用，老数据在构建期兜底解析
  const companyId =
    typeof meta.company === "string"
      ? meta.company
      : resolveCompany(
          typeof meta.sourceId === "string" ? meta.sourceId : null,
          typeof meta.author === "string" ? meta.author : null,
        )?.id;
  const company = companyId ? getCompany(companyId) : undefined;
  const title = String(meta.title ?? "");
  // frontmatter 显式写了 product 时以它为准；没写才按标签/标题兜底解析
  const declared =
    typeof meta.product === "string" ? company?.products.find((entry) => entry.id === meta.product) : undefined;
  const product = declared ?? (company ? resolveProduct(company, tags, title) : undefined);
  // 没有命中产品时退回公司的主模型（ChatGPT / Grok / Command…），且要求文章确实提到它，
  // 避免把纯公司新闻（融资、法律等）也硬标成某个模型
  const model = company ? getCompanyModel(company) : null;
  const mentionsModel = model
    ? [title, ...tags].some((value) => value.toLowerCase().includes(model.toLowerCase()))
    : false;
  const productLabel = product?.name ?? (mentionsModel && model ? model : undefined);

  return {
    slug: String(meta.slug ?? ""),
    title,
    description: String(meta.description ?? ""),
    date,
    time: typeof meta.time === "string" ? meta.time : undefined,
    publishedAt,
    updated: normalizeDateValue(meta.updated) ?? undefined,
    author: typeof meta.author === "string" ? meta.author : undefined,
    company: companyId,
    category: String(meta.category ?? ""),
    subcategory: meta.subcategory,
    categoryLabel: channelLabels.get(String(meta.category ?? "")),
    subcategoryLabel: subcategoryLabels.get(`${String(meta.category ?? "")}/${meta.subcategory}`),
    type: resolveContentType(meta, sourcePath),
    tags,
    product: productLabel,
    productId: product?.id,
    companyTier: company?.tier,
    companyName: company?.name,
    companyLogo: company?.logo,
    readingTime: estimateReadingTime(content),
    href: `/${meta.subcategory}/${meta.slug}/`,
  };
}

/** 读取全部已发布文章（构建期用，可按需多次调用） */
export function readArticleItems(): ArticleListItem[] {
  return getMarkdownFiles(contentDir)
    .map((filePath) => {
      const parsed = matter(fs.readFileSync(filePath, "utf8"));

      if (parsed.data.draft) return null;

      return normalizePost(parsed.data as Record<string, unknown>, parsed.content, filePath);
    })
    .filter((post): post is ArticleListItem => post !== null)
    .sort(
      (a, b) =>
        b.publishedAt.localeCompare(a.publishedAt) ||
        b.date.localeCompare(a.date) ||
        (b.time ?? "").localeCompare(a.time ?? ""),
    );
}
