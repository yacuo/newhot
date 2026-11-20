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
});

export type AboutPage = typeof aboutPage;
