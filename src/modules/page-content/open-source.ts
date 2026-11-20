import { z } from "zod";
import { actionSchema, loadPageData, seoSchema } from "@/modules/content";

const projectSchema = z.object({
  name: z.string().min(1, "project.name 不能为空"),
  repo: z.string().min(1, "project.repo 不能为空"),
  description: z.string().min(1, "project.description 不能为空"),
  category: z.string().min(1, "project.category 不能为空"),
  status: z.string().min(1, "project.status 不能为空"),
  stars: z.number().optional(),
  stack: z.array(z.string()).default([]),
  links: z.object({
    github: z.string().url("links.github 必须是完整链接").optional(),
    docs: z.string().url("links.docs 必须是完整链接").optional(),
    demo: z.string().url("links.demo 必须是完整链接").optional(),
  }),
});

export const openSourcePage = loadPageData("open-source", {
  seo: seoSchema,
  hero: z.object({
    badge: z.string(),
    title: z.string().min(1, "hero.title 不能为空"),
    description: z.string().min(1, "hero.description 不能为空"),
    actions: z.array(actionSchema).min(1, "hero.actions 至少需要一个"),
  }),
  stats: z.array(
    z.object({
      value: z.string().min(1, "stats.value 不能为空"),
      label: z.string().min(1, "stats.label 不能为空"),
    }),
  ),
  projects: z.array(projectSchema).min(1, "projects 至少需要一个项目"),
  contribution: z.object({
    title: z.string().min(1, "contribution.title 不能为空"),
    description: z.string().min(1, "contribution.description 不能为空"),
  }),
});

export type OpenSourceProject = z.output<typeof projectSchema>;
