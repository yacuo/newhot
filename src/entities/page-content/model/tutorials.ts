import { z } from "zod";
import { loadPageData, seoSchema } from "@/entities/article/model";
import { faqItemSchema } from "@/entities/article/model";

export const tutorialsPage = loadPageData("tutorials", {
  seo: seoSchema,
  intro: z.object({
    eyebrow: z.string(),
    title: z.string().min(1, "intro.title 不能为空"),
    description: z.string().min(1, "intro.description 不能为空"),
    faqs: z.array(faqItemSchema).optional(),
  }),
});
