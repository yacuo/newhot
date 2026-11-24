import { z } from "zod";

/** 单条版本发布记录：来源解析结果与文章生成之间的契约 */
export const releaseRecordSchema = z.object({
  vendorId: z.string().min(1),
  vendor: z.string().min(1),
  model: z.string().min(1),
  version: z.string().min(1),
  title: z.string().min(1),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "publishedAt 必须是 YYYY-MM-DD"),
  /** 官方只给到月份时，按月份精度展示，不伪造具体日期 */
  datePrecision: z.enum(["day", "month"]).default("day"),
  summary: z.string().default(""),
  /** 官方条目全文，仅用于成稿，不写入 frontmatter */
  fullText: z.string().default(""),
  /** 官方署名作者，没有则不写 */
  author: z.string().min(1).optional(),
  sourceUrl: z.string().url(),
  /** 本篇实际读过的官方页面，按阅读顺序写入文章「来源」区块 */
  sources: z
    .array(
      z.object({
        title: z.string().min(1),
        url: z.string().url(),
      }),
    )
    .default([]),
  sourceType: z.enum(["rss", "atom", "markdown", "html", "github-issues", "discourse"]),
  /** 详情页图片，已统一压缩并转存；文章正文只引用这里的地址 */
  images: z
    .array(
      z.object({
        url: z.string().url(),
        alt: z.string().default(""),
        context: z.string().default(""),
      }),
    )
    .default([]),
  fetchedAt: z.string().min(1),
  contentHash: z.string().min(1),
});

export type ReleaseRecord = z.output<typeof releaseRecordSchema>;
