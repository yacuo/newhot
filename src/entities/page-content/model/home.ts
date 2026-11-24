import { z } from "zod";
import { loadPageData, seoSchema, textCardSchema } from "@/entities/article/model";

const sectionSchema = z.object({
  title: z.string().min(1, "title 不能为空"),
  description: z.string().min(1, "description 不能为空"),
});

/**
 * 首页文案：导读、关于、原则、Tab 说明、覆盖范围与 FAQ 都在内容仓库维护，
 * 公开仓库只保留示例 JSON，代码只负责结构。
 */
export const homePage = loadPageData("home", {
  seo: seoSchema,
  intro: z.object({
    latestNote: z.string().min(1, "intro.latestNote 不能为空"),
    about: sectionSchema,
    principles: z.array(textCardSchema).min(1, "intro.principles 至少一条"),
    quote: z.object({
      text: z.string().min(1, "intro.quote.text 不能为空"),
      source: z.string().min(1, "intro.quote.source 不能为空"),
      href: z.string().min(1, "intro.quote.href 不能为空"),
    }),
  }),
  tiers: z.object({
    items: z
      .array(
        z.object({
          // id 必须和 list-shards 的 HOME_TIERS 对应
          id: z.enum(["all", "model", "tool", "infra"]),
          label: z.string().min(1, "tiers.items.label 不能为空"),
          description: z.string().min(1, "tiers.items.description 不能为空"),
        }),
      )
      .min(1, "tiers.items 至少一条"),
  }),
  coverage: z.object({
    overview: sectionSchema,
    sources: sectionSchema,
  }),
  faq: z.object({
    items: z
      .array(
        z.object({
          question: z.string().min(1, "faq.items.question 不能为空"),
          answer: z.string().min(1, "faq.items.answer 不能为空"),
        }),
      )
      .min(1, "faq.items 至少一条"),
  }),
});
