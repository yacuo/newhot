import fs from "node:fs";
import path from "node:path";

/** 仓库根目录：Astro 与 npm 脚本都以项目根目录为 cwd 运行。 */
export const REPO_ROOT = process.cwd();

/**
 * 内容根目录：默认仓库根目录，可用 CONTENT_DIR 指向任意内容项目。
 * 内容项目根目录下同时有 `config/`（站点配置）与 `data/`（文章与栏目数据），
 * 整体替换即可切换站点实例；站点仓库自带一份示例内容。
 */
function resolveContentRoot() {
  if (process.env.CONTENT_DIR) {
    const raw = path.resolve(process.env.CONTENT_DIR);
    // 兼容旧用法：CONTENT_DIR 直接指向 data 目录时，根目录取它的上一级
    const looksLikeDataDir =
      path.basename(raw) === "data" ||
      (fs.existsSync(path.join(raw, "channels")) && !fs.existsSync(path.join(raw, "data")));

    return looksLikeDataDir ? path.dirname(raw) : raw;
  }

  return REPO_ROOT;
}

export const CONTENT_ROOT = resolveContentRoot();
export const DATA_DIR = path.join(CONTENT_ROOT, "data");
export const CONFIG_DIR = path.join(CONTENT_ROOT, "config");
export const PUBLIC_DATA_DIR = path.join(REPO_ROOT, "public", "data");
