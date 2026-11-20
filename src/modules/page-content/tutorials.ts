import { z } from "zod";
import { loadPageData, seoSchema } from "@/modules/content";
import { faqItemSchema } from "@/modules/content";

export const tutorialsPage = loadPageData("tutorials", {
  seo: seoSchema,
  intro: z.object({
    eyebrow: z.string(),
    title: z.string().min(1, "intro.title 不能为空"),
    description: z.string().min(1, "intro.description 不能为空"),
    faqs: z.array(faqItemSchema).optional(),
  }),
});
