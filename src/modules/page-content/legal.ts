import { z } from "zod";
import { loadPageData, seoSchema } from "@/modules/content";

const paragraphSection = z.object({
  title: z.string().min(1, "sections.title 不能为空"),
  paragraphs: z.array(z.string().min(1, "paragraphs 不能为空")).min(1, "每个章节至少一段"),
});

const legalDocSchema = z.object({
  seo: seoSchema,
  updated: z.string().min(1, "updated 不能为空"),
  sections: z.array(paragraphSection).min(1, "sections 至少一节"),
});

const cookieRowSchema = z.object({
  name: z.string().min(1, "rows.name 不能为空"),
  type: z.string().min(1, "rows.type 不能为空"),
  purpose: z.string().min(1, "rows.purpose 不能为空"),
  duration: z.string().min(1, "rows.duration 不能为空"),
});

/** 法规页文案：正文与 SEO 都在内容仓库维护，代码只负责结构 */
export const legalPage = loadPageData("legal", {
  privacy: legalDocSchema,
  terms: legalDocSchema,
  cookies: z.object({
    seo: seoSchema,
    updated: z.string().min(1, "updated 不能为空"),
    rows: z.object({
      current: z.array(cookieRowSchema).min(1, "rows.current 至少一行"),
      ads: z.array(cookieRowSchema).min(1, "rows.ads 至少一行"),
    }),
  }),
  doNotSell: legalDocSchema,
});
