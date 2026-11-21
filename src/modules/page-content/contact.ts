import { z } from "zod";
import { actionSchema, loadPageData, seoSchema } from "@/modules/content";

export const contactPage = loadPageData("contact", {
  seo: seoSchema,
  header: z.object({
    eyebrow: z.string().min(1, "header.eyebrow 不能为空"),
    title: z.string().min(1, "header.title 不能为空"),
    description: z.string().min(1, "header.description 不能为空"),
  }),
  channels: z
    .array(
      z.object({
        title: z.string().min(1, "channels.title 不能为空"),
        description: z.string().min(1, "channels.description 不能为空"),
        action: actionSchema,
      }),
    )
    .min(1, "channels 至少一条"),
  footer: z.object({
    label: z.string().min(1, "footer.label 不能为空"),
    linkLabel: z.string().min(1, "footer.linkLabel 不能为空"),
    note: z.string().min(1, "footer.note 不能为空"),
  }),
});
