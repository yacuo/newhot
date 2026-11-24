import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { CONFIG_DIR, DATA_DIR, REPO_ROOT } from "./paths";

/** 页面级通用字段：每个页面的 seo.json 都用这一套 */
export const seoSchema = z.object({
  title: z.string().min(1, "seo.title 不能为空"),
  description: z.string().min(1, "seo.description 不能为空"),
  path: z.string().min(1, "seo.path 不能为空"),
});

/** 按钮/链接：页面级配置里只描述行为，文案由 JSON 填充 */
export const actionSchema = z.object({
  label: z.string().min(1, "action.label 不能为空"),
  href: z.string().min(1, "action.href 不能为空"),
  external: z.boolean().optional(),
  variant: z.enum(["primary", "secondary"]).optional(),
});

/** 标题 + 描述的卡片，页面里最常见的填充结构 */
export const textCardSchema = z.object({
  title: z.string().min(1, "title 不能为空"),
  description: z.string().min(1, "description 不能为空"),
});

type SectionSchemas = Record<string, z.ZodTypeAny>;

type PageData<TSections extends SectionSchemas> = {
  [K in keyof TSections]: z.output<TSections[K]>;
};

function toFileName(key: string) {
  return `${key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}.json`;
}

/**
 * 按约定读取内容项目的 `config/<pageId>/*.json`。
 *
 * 约定：
 * - 配置放 config/，内容放 data/；
 * - TS 里声明了哪些区块，目录里就必须有同名 JSON（contentEntry → content-entry.json）；
 * - 目录里不允许出现 TS 未声明的 JSON，避免孤儿数据；
 * - 构建期校验，缺文件、多文件、字段错误都会直接失败。
 */
export function loadPageData<TSections extends SectionSchemas>(
  pageId: string,
  sections: TSections,
): PageData<TSections> {
  const configDir = path.join(CONFIG_DIR, pageId);
  const dataDir = path.join(DATA_DIR, pageId);
  const repoDir = path.join(REPO_ROOT, "config", pageId);
  const pageDir = fs.existsSync(configDir)
    ? configDir
    : fs.existsSync(dataDir)
      ? dataDir
      : fs.existsSync(repoDir)
        ? repoDir
        : null;

  if (!pageDir) {
    throw new Error(`config/${pageId}: 目录不存在`);
  }

  const labelRoot =
    pageDir === configDir
      ? `config/${pageId}`
      : pageDir === dataDir
        ? `data/${pageId}`
        : `config/${pageId}（站点示例）`;
  const expectedFiles = new Set(Object.keys(sections).map(toFileName));

  for (const file of fs.readdirSync(pageDir)) {
    if (file.endsWith(".json") && !expectedFiles.has(file)) {
      throw new Error(
        `${labelRoot}/${file}: 没有对应的 schema，请在 src/entities/page-content/model/${pageId}.ts 中声明`,
      );
    }
  }

  const data = {} as Record<string, unknown>;

  for (const [key, schema] of Object.entries(sections)) {
    const fileName = toFileName(key);
    const filePath = path.join(pageDir, fileName);
    const label = `${labelRoot}/${fileName}`;

    if (!fs.existsSync(filePath)) {
      throw new Error(`${label}: 文件缺失，src/entities/page-content/model/${pageId}.ts 声明了 ${key}`);
    }

    let raw: unknown;

    try {
      raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (error) {
      throw new Error(`${label}: JSON 解析失败（${(error as Error).message}）`);
    }

    const parsed = schema.safeParse(raw);

    if (!parsed.success) {
      const detail = parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "根对象"}: ${issue.message}`)
        .join("；");
      throw new Error(`${label}: 配置校验失败，${detail}`);
    }

    data[key] = parsed.data;
  }

  return data as PageData<TSections>;
}
