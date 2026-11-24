import fs from "node:fs";
import path from "node:path";
import { CONFIG_DIR, REPO_ROOT } from "@/entities/article/model/paths";

const DEFAULT_CONFIG_DIR = path.join(REPO_ROOT, "config");

/** 配置优先取内容项目的 config/，没有该文件时回退到站点自带的示例配置。 */
export function configFilePath(fileName: string) {
  const contentFile = path.join(CONFIG_DIR, fileName);

  if (fs.existsSync(contentFile)) {
    return contentFile;
  }

  return path.join(DEFAULT_CONFIG_DIR, fileName);
}

export function readConfigJson<T>(fileName: string): T {
  const filePath = configFilePath(fileName);

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch (error) {
    throw new Error(`config/${fileName}: 读取失败（${(error as Error).message}）`);
  }
}
