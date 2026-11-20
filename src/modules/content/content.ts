import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { markdownToHtml, extractHeadings } from "./markdown";
import type { Post } from "./schema";
import { postMetaSchema } from "./schema";
import { estimateReadingTime } from "@/shared/utils";
import { DATA_DIR } from "./paths";

function getMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return getMarkdownFiles(fullPath);
    }

    return entry.isFile() && entry.name.endsWith(".md") ? [fullPath] : [];
  });
}

function createExcerpt(content: string) {
  return content
    .replace(/^---[\s\S]*?---/, "")
    .replace(/[#>*_`\-[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}

function normalizeDateValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value;
}

function hydratePostMeta(meta: Record<string, unknown>) {
  const normalizedDate = normalizeDateValue(meta.date);

  return {
    ...meta,
    date: normalizedDate,
    updated: normalizeDateValue(meta.updated),
  };
}

/**
 * 读取并校验所有文章。
 *
 * 构建期执行；如果 Frontmatter 错误，应直接失败，避免坏页面上线。
 * 文章页、sitemap、教程页都会调用这里，按进程缓存一次，避免每页重复解析全部 Markdown。
 */
let postsPromise: Promise<Post[]> | null = null;

export function getAllPosts(): Promise<Post[]> {
  if (!postsPromise) {
    postsPromise = loadAllPosts().catch((error: unknown) => {
      // 失败不缓存，方便下一次构建重新尝试
      postsPromise = null;
      throw error;
    });
  }

  return postsPromise;
}

async function loadAllPosts(): Promise<Post[]> {
  // 更新日志是独立栏目，不参与文章构建
  const updateLogDir = `${path.join(DATA_DIR, "update-log")}${path.sep}`;
  const files = getMarkdownFiles(DATA_DIR).filter((file) => !file.startsWith(updateLogDir));
  const posts = await Promise.all(
    files.map(async (sourcePath) => {
      const raw = fs.readFileSync(sourcePath, "utf8");
      const parsed = matter(raw);
      const meta = postMetaSchema.parse(hydratePostMeta(parsed.data as Record<string, unknown>));

      if (!parsed.content.trim()) {
        throw new Error(`${sourcePath}: 正文不能为空`);
      }

      const relativePath = path.relative(DATA_DIR, sourcePath).split(path.sep).join("/");
      const isColumnPost = relativePath.startsWith("tutorials/");

      if (!isColumnPost && !meta.subcategory) {
        throw new Error(`${sourcePath}: 频道文章必须设置 subcategory，用于生成 /{二级分类}/{slug}/ 路径`);
      }

      const columnId = isColumnPost ? relativePath.split("/")[1] : null;
      const html = await markdownToHtml(parsed.content);

      return {
        ...meta,
        content: parsed.content,
        html,
        excerpt: createExcerpt(parsed.content),
        readingTime: estimateReadingTime(parsed.content),
        headings: extractHeadings(parsed.content),
        sourcePath,
        href: columnId ? `/${columnId}/${meta.slug}/` : `/${meta.subcategory}/${meta.slug}/`,
      } satisfies Post;
    }),
  );

  const publishedPosts = posts.filter((post) => !post.draft);
  const urls = new Set<string>();

  for (const post of publishedPosts) {
    if (urls.has(post.href)) {
      throw new Error(`文章路径重复：${post.href}`);
    }

    urls.add(post.href);
  }

  return publishedPosts.sort((a, b) => b.date.localeCompare(a.date));
}

export function getRelatedPosts(currentPost: Post, posts: Post[], limit = 3) {
  return posts
    .filter((post) => post.slug !== currentPost.slug)
    .map((post) => {
      const categoryScore = post.category === currentPost.category ? 2 : 0;
      const tagScore = post.tags.filter((tag) => currentPost.tags.includes(tag)).length;

      return { post, score: categoryScore + tagScore };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.post.date.localeCompare(a.post.date))
    .slice(0, limit)
    .map((item) => item.post);
}
