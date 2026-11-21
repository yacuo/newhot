import { z } from "zod";
import { actionSchema, loadPageData, seoSchema } from "@/modules/content";

export const contributePage = loadPageData("contribute", {
  seo: seoSchema,
  header: z.object({
    eyebrow: z.string().min(1, "header.eyebrow 不能为空"),
    title: z.string().min(1, "header.title 不能为空"),
    description: z.string().min(1, "header.description 不能为空"),
  }),
  sections: z
    .array(
      z.object({
        title: z.string().min(1, "sections.title 不能为空"),
        paragraphs: z.array(z.string().min(1)).min(1, "sections.paragraphs 至少一段"),
      }),
    )
    .min(1, "sections 至少一节"),
  actions: z.array(actionSchema).min(1, "actions 至少一个"),
});
