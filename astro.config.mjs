import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("./", import.meta.url));

/**
 * 内容根目录：默认站点自身（示例 config/ + data/），
 * 正式站点用 CONTENT_DIR 指向任意内容项目根目录（同样包含 config/ 与 data/）。
 */
const rawContentDir = process.env.CONTENT_DIR
  ? path.resolve(process.env.CONTENT_DIR)
  : root;
// 兼容旧用法：CONTENT_DIR 直接指向 data 目录时，根目录取它的上一级
const contentLooksLikeDataDir =
  path.basename(rawContentDir) === "data" ||
  (fs.existsSync(path.join(rawContentDir, "channels")) && !fs.existsSync(path.join(rawContentDir, "data")));
const contentRoot = contentLooksLikeDataDir ? path.dirname(rawContentDir) : rawContentDir;

// 配置优先取内容项目 config/，没有该文件时回退到站点自带的示例配置
function contentConfig(fileName) {
  const contentFile = path.join(contentRoot, "config", fileName);
  return fs.existsSync(contentFile) ? contentFile : path.join(root, "config", fileName);
}

// 站点地址优先取环境变量，其次内容项目 config/global/site.json
let contentSiteUrl = "https://newhot.org";
try {
  const siteJson = JSON.parse(fs.readFileSync(contentConfig("global/site.json"), "utf8"));
  if (siteJson.url) contentSiteUrl = siteJson.url;
} catch {
  // 配置缺失时使用默认值
}

export default defineConfig({
  site: process.env.SITE_URL ?? contentSiteUrl,
  output: "static",
  trailingSlash: "always",
  build: { format: "directory" },
  publicDir: "./public",
  compressHTML: true,
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        // 客户端也会消费的配置：内容项目可整体覆盖
        "@site-content/config/global/search.json": contentConfig("global/search.json"),
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  },
});
