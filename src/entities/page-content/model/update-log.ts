import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { actionSchema, loadPageData, seoSchema } from "@/entities/article/model";
import { DATA_DIR } from "@/entities/article/model/paths";
import { updateLogEntrySchema, type UpdateLogEntryMeta } from "./update-log.schema";

/**
 * 一篇日志 = `data/update-log/posts/{slug}.md`。
 * 文件名就是 slug，frontmatter 必须符合 update-log.schema.ts 的固定格式。
 */
export const updateLogPage = loadPageData("update-log", {
  seo: seoSchema,
  page: z.object({
    badge: z.string(),
    title: z.string().min(1, "page.title 不能为空"),
    description: z.string().min(1, "page.description 不能为空"),
    action: actionSchema,
  }),
});

const POSTS_DIR = path.join(DATA_DIR, "update-log", "posts");

function normalizeDate(value: unknown) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

function loadEntries() {
  if (!fs.existsSync(POSTS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(POSTS_DIR)
    .filter((name) => name.endsWith(".md"))
    .map((name) => {
      const slug = name.slice(0, -".md".length);
      const filePath = path.join(POSTS_DIR, name);
      const label = path.relative(DATA_DIR, filePath);

      if (!/^[a-z0-9-]+$/.test(slug)) {
        throw new Error(`${label}: 文件名只能包含小写字母、数字和连字符`);
      }

      const parsed = matter(fs.readFileSync(filePath, "utf8"));
      const result = updateLogEntrySchema.safeParse({
        ...parsed.data,
        date: normalizeDate(parsed.data.date),
      });

      if (!result.success) {
        const detail = result.error.issues
          .map((issue) => `${issue.path.join(".") || "根对象"}: ${issue.message}`)
          .join("；");
        throw new Error(`${label}: frontmatter 校验失败（${detail}）`);
      }

      return { slug, ...result.data };
    });
}

export type UpdateLogEntry = UpdateLogEntryMeta & { slug: string };

/** 时间倒序：最新的一篇排最前；同一时刻按 slug 稳定排序 */
export const updateLogEntries: UpdateLogEntry[] = loadEntries().sort((a, b) => {
  const left = `${a.date} ${a.time}`;
  const right = `${b.date} ${b.time}`;

  return left === right ? a.slug.localeCompare(b.slug) : left < right ? 1 : -1;
});

export function getUpdateLogEntry(slug: string) {
  return updateLogEntries.find((entry) => entry.slug === slug) ?? null;
}

/** 一条日志的变更总数，列表里用来显示信息量 */
export function countLogChanges(entry: UpdateLogEntry) {
  return entry.added.length + entry.improved.length + entry.fixed.length;
}

export type UpdateLogPage = typeof updateLogPage;
