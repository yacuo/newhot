import { z } from "zod";
import { actionSchema, loadPageData, seoSchema, textCardSchema } from "@/modules/content";

const sectionHeaderSchema = {
  eyebrow: z.string(),
  title: z.string().min(1, "title 不能为空"),
  description: z.string().min(1, "description 不能为空"),
};

export const aboutPage = loadPageData("about", {
  seo: seoSchema,
  intro: z.object({
    badge: z.string(),
    title: z.string().min(1, "intro.title 不能为空"),
    description: z.string().min(1, "intro.description 不能为空"),
  }),
  metrics: z.object({
    ...sectionHeaderSchema,
    note: z.string(),
    items: z
      .array(
        z.object({
          // key 决定页面上取哪个实时数值，新增指标需要同时在 about/page.tsx 里补上映射
          key: z.enum(["total", "channels", "subcategories", "themes", "companies", "products", "latest"]),
          label: z.string().min(1, "metrics.items.label 不能为空"),
          unit: z.string(),
          description: z.string().min(1, "metrics.items.description 不能为空"),
        }),
      )
      .min(1, "metrics.items 至少需要一项"),
  }),
  workflow: z.object({
    ...sectionHeaderSchema,
    steps: z.array(textCardSchema).min(1, "workflow.steps 至少需要一步"),
  }),
  scope: z.object({
    ...sectionHeaderSchema,
    included: z.array(textCardSchema).min(1, "scope.included 至少需要一条"),
    excluded: z.array(textCardSchema).min(1, "scope.excluded 至少需要一条"),
    note: z.string(),
  }),
  taxonomy: z.object({
    ...sectionHeaderSchema,
    levels: z.array(textCardSchema).min(1, "taxonomy.levels 至少需要一条"),
    note: z.string(),
  }),
  architecture: z.object({
    eyebrow: z.string(),
    title: z.string().min(1, "architecture.title 不能为空"),
    description: z.string().min(1, "architecture.description 不能为空"),
    items: z.array(textCardSchema).min(1, "architecture.items 至少需要一张卡片"),
  }),
  contentEntry: z.object({
    eyebrow: z.string(),
    title: z.string().min(1, "contentEntry.title 不能为空"),
    description: z.string().min(1, "contentEntry.description 不能为空"),
    action: actionSchema,
  }),
  guide: z.object({
    heading: z.string().min(1, "guide.heading 不能为空"),
    sourcesHeading: z.string().min(1, "guide.sourcesHeading 不能为空"),
    sourcesDescription: z.string().min(1, "guide.sourcesDescription 不能为空"),
    description: z.string().min(1, "guide.description 不能为空"),
    points: z.array(z.string().min(1)).min(1, "guide.points 至少一条"),
    sources: z
      .array(
        z.object({
          name: z.string().min(1, "guide.sources.name 不能为空"),
          href: z.string().min(1, "guide.sources.href 不能为空"),
        }),
      )
      .min(1, "guide.sources 至少一个"),
    quote: z.object({
      text: z.string().min(1, "guide.quote.text 不能为空"),
      label: z.string().min(1, "guide.quote.label 不能为空"),
      href: z.string().min(1, "guide.quote.href 不能为空"),
    }),
  }),
});

export type AboutPage = typeof aboutPage;
