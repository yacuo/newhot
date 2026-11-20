import path from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url)).replace(/\/$/, "");
/** 内容根目录：默认仓库内 data/，可用 CONTENT_DIR 指向外部内容目录 */
export const DATA_DIR = process.env.CONTENT_DIR
  ? path.resolve(process.env.CONTENT_DIR)
  : path.join(REPO_ROOT, "data");
export const PUBLIC_DATA_DIR = path.join(REPO_ROOT, "public", "data");
