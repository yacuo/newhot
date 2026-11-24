import { z } from "zod";

/** 配置文件的 Zod 契约：构建前统一校验，字段写错直接失败。 */

const siteIconsSchema = z
  .object({
    ico: z.string(),
    svg: z.string(),
    png48: z.string(),
    png96: z.string(),
    png192: z.string(),
    appleTouch: z.string(),
  })
  .partial()
  .strict();

export const siteConfigSchema = z
  .object({
    name: z.string().trim().min(1),
    wordmark: z.array(z.string().trim().min(1)).min(1),
    url: z.string().url(),
    description: z.string().min(1),
    ogImage: z.string().min(1),
    logo: z.string().min(1),
    icons: siteIconsSchema,
    author: z.string().min(1),
    language: z.string().min(1),
    repository: z.string().url(),
    copyright: z.string().min(1),
    apiBaseUrl: z.string(),
    skillName: z.string().min(1),
  })
  .partial()
  .strict();

export const contentTypeIdSchema = z.enum([
  "release",
  "update",
  "preview",
  "incident",
  "fix",
  "tutorial",
  "compare",
  "benchmark",
]);

export const contentTypesConfigSchema = z
  .object({
    types: z
      .array(
        z
          .object({
            id: contentTypeIdSchema,
            label: z.string().trim().min(1),
            description: z.string().trim().min(1),
          })
          .strict(),
      )
      .min(1),
    defaults: z.record(z.string(), contentTypeIdSchema),
  })
  .strict();

export const sourceLinkSchema = z
  .object({
    name: z.string().trim().min(1),
    href: z.string().url(),
  })
  .strict();

export const sourcesConfigSchema = z
  .object({
    defaultSources: z.array(sourceLinkSchema).min(1),
    channelSources: z.record(z.string(), z.array(sourceLinkSchema)),
    tutorialSources: z.array(sourceLinkSchema).min(1),
  })
  .strict();

export const searchPromotionSchema = z
  .object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    href: z.string().trim().min(1),
    external: z.boolean().optional(),
    enabled: z.boolean().optional(),
    alwaysShow: z.boolean().optional(),
    keywords: z.array(z.string().trim().min(1)).optional(),
  })
  .strict();

export const searchConfigSchema = z
  .object({
    promotions: z.array(searchPromotionSchema).min(1),
  })
  .strict();

export function formatConfigError(error: z.ZodError, label: string) {
  const detail = error.issues
    .map((issue) => `${issue.path.join(".") || "根对象"}: ${issue.message}`)
    .join("；");

  return `${label}: 配置不合法（${detail}）`;
}
