import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { faqItemSchema, type Post } from "@/entities/article/model";
import { CONFIG_DIR, DATA_DIR, REPO_ROOT } from "@/entities/article/model/paths";

const tutorialIconSchema = z.enum(["book", "code", "spark", "route"]);

const tutorialTypeSchema = z.enum(["ai", "frontend", "backend", "data"]);

export const tutorialTypeLabels: Record<z.infer<typeof tutorialTypeSchema>, string> = {
  ai: "AI 教程",
  frontend: "前端教程",
  backend: "后端教程",
  data: "大数据教程",
};

const tutorialArticleItemSchema = z.union([
  z.string().min(1, "文章 slug 不能为空"),
  z.object({
    href: z.string().min(1, "href 不能为空"),
    sidebarTitle: z.string().min(1, "sidebarTitle 不能为空"),
    description: z.string().optional(),
    badge: z.string().optional(),
  }),
]);

const tutorialSectionSchema = z.object({
  title: z.string().min(1, "章节标题不能为空"),
  description: z.string().optional(),
  icon: tutorialIconSchema.optional(),
  articles: z.array(tutorialArticleItemSchema).min(1, "章节至少要有一篇文章"),
});

const tutorialCatalogSchema = z.object({
  order: z.number().int().nonnegative(),
  title: z.string().min(1, "title 不能为空"),
  description: z.string().min(1, "description 不能为空"),
  type: tutorialTypeSchema,
  author: z.string().min(1, "author 不能为空"),
  source: z.string().min(1, "source 不能为空"),
  publishedAt: z.string().date("publishedAt 必须是 YYYY-MM-DD"),
  updatedAt: z.string().date("updatedAt 必须是 YYYY-MM-DD").optional(),
  icon: tutorialIconSchema,
  gradient: z.object({
    from: z.string().min(1),
    to: z.string().min(1),
  }),
  introBlocks: z
    .array(
      z.object({
        title: z.string().min(1, "introBlocks.title 不能为空"),
        description: z.string().min(1, "introBlocks.description 不能为空"),
      }),
    )
    .default([]),
  sections: z.array(tutorialSectionSchema).min(1, "至少需要一个章节"),
  faqs: z.array(faqItemSchema).optional(),
});

export type TutorialArticleItem = z.infer<typeof tutorialArticleItemSchema>;
export type TutorialSectionConfig = z.infer<typeof tutorialSectionSchema>;
export type TutorialCatalog = z.infer<typeof tutorialCatalogSchema> & { id: string };

export type ResolvedTutorialArticle = {
  href: string;
  sidebarTitle: string;
  description?: string;
  badge?: string;
  external: boolean;
  slug?: string;
  post?: Post;
};

export type ResolvedTutorialSection = Omit<TutorialSectionConfig, "articles"> & {
  articles: ResolvedTutorialArticle[];
};

export type ResolvedTutorialCatalog = Omit<TutorialCatalog, "sections"> & {
  sections: ResolvedTutorialSection[];
  articleCount: number;
};

const tutorialsConfigDir = path.join(CONFIG_DIR, "tutorials");
const tutorialsCatalogDir = path.join(tutorialsConfigDir, "catalogs");
const tutorialsDataDir = path.join(DATA_DIR, "tutorials");

function resolveCatalogPath(id: string) {
  const configPath = path.join(tutorialsCatalogDir, `${id}.json`);
  if (fs.existsSync(configPath)) return configPath;
  return path.join(tutorialsDataDir, id, "catalog.json");
}

function isExternalHref(href: string) {
  return /^https?:\/\//.test(href);
}

function trimSlash(value: string) {
  return value.replace(/^\/+|\/+$/g, "");
}

function formatSlugTitle(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * 读取教程配置：优先 config/tutorials/<id>.json，兼容旧的 data/tutorials/<id>/catalog.json。
 *
 * 构建期执行；配置缺失或格式错误直接失败，避免带着坏目录上线。
 */
function readTutorialCatalog(id: string): TutorialCatalog {
  const catalogPath = resolveCatalogPath(id);
  const relativePath = path.relative(REPO_ROOT, catalogPath);

  if (!fs.existsSync(catalogPath)) {
    throw new Error(`${relativePath}: 教程配置不存在`);
  }

  let raw: unknown;

  try {
    raw = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  } catch (error) {
    throw new Error(`${relativePath}: JSON 解析失败（${(error as Error).message}）`);
  }

  const parsed = tutorialCatalogSchema.safeParse(raw);

  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "根对象"}: ${issue.message}`)
      .join("；");
    throw new Error(`${relativePath}: 配置校验失败，${detail}`);
  }

  return { id, ...parsed.data };
}

export function getTutorialCatalogs() {
  const ids = new Set<string>();

  if (fs.existsSync(tutorialsCatalogDir)) {
    for (const entry of fs.readdirSync(tutorialsCatalogDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
      ids.add(entry.name.slice(0, -".json".length));
    }
  }

  if (fs.existsSync(tutorialsDataDir)) {
    for (const entry of fs.readdirSync(tutorialsDataDir, { withFileTypes: true })) {
      if (entry.isDirectory() && fs.existsSync(path.join(tutorialsDataDir, entry.name, "catalog.json"))) {
        ids.add(entry.name);
      }
    }
  }

  return [...ids]
    .map((id) => readTutorialCatalog(id))
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

function resolveArticle(
  item: TutorialArticleItem,
  catalogId: string,
  postsBySlug: Map<string, Post>,
): ResolvedTutorialArticle {
  const rawHref = typeof item === "string" ? item : item.href;
  const configuredTitle = typeof item === "string" ? undefined : item.sidebarTitle;
  const description = typeof item === "string" ? undefined : item.description;
  const badge = typeof item === "string" ? undefined : item.badge;

  if (isExternalHref(rawHref)) {
    return {
      href: rawHref,
      sidebarTitle: configuredTitle ?? rawHref,
      description,
      badge: badge ?? "外部",
      external: true,
    };
  }

  if (rawHref.startsWith("/")) {
    const slugMatch = rawHref.match(/^\/[^/]+\/([^/]+)\/?$/);
    const slug = slugMatch?.[1];
    const post = slug ? postsBySlug.get(slug) : undefined;

    return {
      href: rawHref,
      sidebarTitle: configuredTitle ?? post?.title ?? rawHref,
      description: description ?? post?.description,
      badge,
      external: false,
      slug,
      post,
    };
  }

  const slug = trimSlash(rawHref);
  const post = postsBySlug.get(slug);

  if (!post || post.href !== `/${catalogId}/${slug}/`) {
    throw new Error(
      `${catalogId}/catalog.json: 引用的文章 ${slug} 不存在或不属于 ${catalogId} 目录`,
    );
  }

  return {
    href: `/${catalogId}/${slug}/`,
    sidebarTitle: configuredTitle ?? post.title,
    description: description ?? post.description,
    badge,
    external: false,
    slug,
    post,
  };
}

export function getResolvedTutorialCatalogs(posts: Post[]): ResolvedTutorialCatalog[] {
  const postsBySlug = new Map(posts.map((post) => [post.slug, post]));

  return getTutorialCatalogs().map((catalog) => {
    const sections = catalog.sections.map((section) => ({
      ...section,
      articles: section.articles.map((item) => resolveArticle(item, catalog.id, postsBySlug)),
    }));

    return {
      ...catalog,
      sections,
      articleCount: sections.reduce((total, section) => total + section.articles.length, 0),
    };
  });
}

export function getResolvedTutorialCatalogById(posts: Post[], catalogId: string) {
  return getResolvedTutorialCatalogs(posts).find((catalog) => catalog.id === catalogId) ?? null;
}

export function findTutorialArticlePathBySlug(posts: Post[], slug: string) {
  for (const catalog of getResolvedTutorialCatalogs(posts)) {
    for (const section of catalog.sections) {
      const article = section.articles.find((item) => item.slug === slug && !item.external && item.post);

      if (article) {
        return article.href;
      }
    }
  }

  return null;
}

export function findTutorialArticle(catalog: ResolvedTutorialCatalog, slug: string) {
  for (const section of catalog.sections) {
    const index = section.articles.findIndex((article) => article.slug === slug);

    if (index >= 0) {
      return {
        section,
        article: section.articles[index],
        index,
      };
    }
  }

  return null;
}

export function getTutorialStaticParams(posts: Post[]) {
  return getResolvedTutorialCatalogs(posts).flatMap((catalog) =>
    catalog.sections.flatMap((section) =>
      section.articles
        .filter((article) => article.slug && article.post && article.href === `/${catalog.id}/${article.slug}/`)
        .map((article) => ({ tutorialId: catalog.id, slug: article.slug as string })),
    ),
  );
}
