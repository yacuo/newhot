import { z } from "zod";
import { contentTypeIds, type ContentTypeId } from "./content-types";
import type { HomeTier } from "./list-shards";

const contentTypeSchema = z.enum(contentTypeIds as [ContentTypeId, ...ContentTypeId[]]);

export const faqItemSchema = z.object({
  question: z.string().min(1, "FAQ question 不能为空"),
  answer: z.string().min(1, "FAQ answer 不能为空"),
});

export const glossaryItemSchema = z.object({
  term: z.string().min(1, "glossary.term 不能为空"),
  definition: z.string().min(1, "glossary.definition 不能为空"),
});

export const sourceItemSchema = z.object({
  title: z.string().min(1, "source.title 不能为空"),
  url: z.string().url("source.url 必须是完整链接"),
  publisher: z.string().min(1).optional(),
  accessedAt: z.string().date("source.accessedAt 必须是 YYYY-MM-DD").optional(),
});

export const postMetaSchema = z.object({
  title: z.string().min(1, "title 不能为空"),
  slug: z
    .string()
    .min(1, "slug 不能为空")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug 只能使用小写英文、数字和连字符"),
  description: z.string().min(1, "description 不能为空"),
  date: z.string().date("date 必须是 YYYY-MM-DD"),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "time 必须是 HH:MM")
    .optional(),
  updated: z.string().date("updated 必须是 YYYY-MM-DD").optional(),
  author: z.string().min(1, "author 不能为空").optional(),
  /** 公司归属：对应 data/vendors/companies.json 的 id，由采集流程按来源映射写入 */
  company: z.string().min(1, "company 不能为空").optional(),
  /** 产品归属：对应该公司 products[].id，写稿/采集时写入；缺失时构建期按标签兜底解析 */
  product: z.string().min(1, "product 不能为空").optional(),
  source: z.string().url("source 必须是完整链接").optional(),
  category: z.string().min(1, "category 不能为空"),
  subcategory: z.string().min(1).optional(),
  type: contentTypeSchema.optional(),
  tags: z.array(z.string()).default([]),
  faqs: z.array(faqItemSchema).default([]).optional(),
  glossary: z.array(glossaryItemSchema).default([]).optional(),
  sources: z.array(sourceItemSchema).default([]).optional(),
  draft: z.boolean().default(false),
  /** 自动化导入产出的溯源与状态字段 */
  status: z.enum(["draft", "reviewed", "published"]).optional(),
  sourceId: z.string().min(1, "sourceId 不能为空").optional(),
  fetchedAt: z.string().min(1, "fetchedAt 不能为空").optional(),
  contentHash: z.string().min(1, "contentHash 不能为空").optional(),
  generator: z
    .object({
      provider: z.string().min(1, "generator.provider 不能为空"),
      model: z.string().min(1, "generator.model 不能为空"),
      prompt: z.string().min(1, "generator.prompt 不能为空"),
    })
    .optional(),
});

export type PostMeta = z.infer<typeof postMetaSchema>;

export type ArticleListItem = Pick<PostMeta, "title" | "description" | "date" | "time" | "updated" | "author" | "company" | "category" | "subcategory" | "tags"> & {
  slug: string;
  type: ContentTypeId;
  readingTime: number;
  href: string;
  /** 构建期写入的频道/分类显示名，客户端列表不再依赖频道配置 */
  categoryLabel?: string;
  subcategoryLabel?: string;
  /** 构建期按公司 + tags/标题解析出的产品归属，用于列表展示与筛选 */
  product?: string;
  productId?: string;
  /** 公司层级，构建期从 companies.json 写入，首页按大模型/工具/开源与运行时筛选 */
  companyTier?: "model" | "tool" | "infra";
  /** 公司展示名与 logo，构建期写入，列表作者位直接使用，客户端不再查公司表 */
  companyName?: string;
  companyLogo?: string;
};

/** 频道 / 分类 / 公司的统计信息，供列表页显示计数与最新日期 */
export type FeedMeta = {
  generatedAt: string;
  total: number;
  latest: string | null;
  channels: Record<string, { count: number; latest: string }>;
  subcategories: Record<string, { count: number; latest: string }>;
  companies: Record<string, { count: number; releaseCount: number; channels: string[]; latest: string }>;
};

/** 首页只带各层级的首批条目，不再有全站全量 feed */
export type HomeFeed = {
  generatedAt: string;
  tiers: Record<HomeTier, { total: number; latest: string | null; initial: ArticleListItem[] }>;
};

export type ListShard = {
  scope: string;
  page: number;
  shardSize: number;
  total: number;
  items: ArticleListItem[];
};

export type ListManifest = {
  generatedAt: string;
  channels: string[];
  tiers: HomeTier[];
  companies: string[];
};

export type Post = PostMeta & {
  content: string;
  html: string;
  excerpt: string;
  readingTime: number;
  headings: TableOfContentsItem[];
  sourcePath: string;
  href: string;
};

export type TableOfContentsItem = {
  id: string;
  text: string;
  level: 2 | 3 | 4;
};
