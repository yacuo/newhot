import fs from "node:fs";
import path from "node:path";
import { DATA_DIR } from "@/modules/content/paths";

/**
 * 读取 data/vendors 下的 JSON。
 *
 * 走 DATA_DIR 而不是相对 import，才能跟着 CONTENT_DIR 切换到外部真实内容目录；
 * 公开仓库里读到的就是示例数据。
 */
export function readVendorJson<T>(fileName: string): T {
  const filePath = path.join(DATA_DIR, "vendors", fileName);

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch (error) {
    throw new Error(`data/vendors/${fileName}: 读取失败（${(error as Error).message}）`);
  }
}
