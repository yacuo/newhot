import { z } from "zod";
import { loadPageData } from "@/modules/content";

const quoteSchema = z.object({
  text: z.string().min(1, "quote.text 不能为空"),
  label: z.string().min(1, "quote.label 不能为空"),
  href: z.string().min(1, "quote.href 不能为空"),
});

/** 频道、主题与教程页反复出现的同一段说明，集中到内容仓库维护 */
export const sharedPage = loadPageData("shared", {
  guide: z.object({
    defaults: z.object({
      sourcesHeading: z.string().min(1, "defaults.sourcesHeading 不能为空"),
      sourcesDescription: z.string().min(1, "defaults.sourcesDescription 不能为空"),
      points: z.array(z.string().min(1)).min(1, "defaults.points 至少一条"),
      quote: quoteSchema,
    }),
    theme: z.object({
      panelTitle: z.string().min(1, "theme.panelTitle 不能为空"),
      panelEyebrow: z.string().min(1, "theme.panelEyebrow 不能为空"),
      heading: z.string().min(1, "theme.heading 不能为空"),
      description: z.string().min(1, "theme.description 不能为空"),
    }),
    channel: z.object({
      description: z.string().min(1, "channel.description 不能为空"),
    }),
    tutorial: z.object({
      index: z.object({
        heading: z.string().min(1, "tutorial.index.heading 不能为空"),
        description: z.string().min(1, "tutorial.index.description 不能为空"),
        points: z.array(z.string().min(1)).min(1, "tutorial.index.points 至少一条"),
        quote: quoteSchema,
      }),
      detail: z.object({
        heading: z.string().min(1, "tutorial.detail.heading 不能为空"),
        suffix: z.string().min(1, "tutorial.detail.suffix 不能为空"),
        points: z.array(z.string().min(1)).min(1, "tutorial.detail.points 至少一条"),
        quote: quoteSchema,
      }),
    }),
  }),
  notFound: z.object({
    title: z.string().min(1, "notFound.title 不能为空"),
    description: z.string().min(1, "notFound.description 不能为空"),
    path: z.string().min(1, "notFound.path 不能为空"),
    code: z.string().min(1, "notFound.code 不能为空"),
    heading: z.string().min(1, "notFound.heading 不能为空"),
    message: z.string().min(1, "notFound.message 不能为空"),
    action: z.object({
      label: z.string().min(1, "notFound.action.label 不能为空"),
      href: z.string().min(1, "notFound.action.href 不能为空"),
    }),
  }),
});
