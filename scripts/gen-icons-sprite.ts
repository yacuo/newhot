/**
 * 生成 public/icons.svg 精灵图。
 *
 * 把 icon-data.ts 里的 lucide 图标与站点自有的品牌图标合并成一个外部 sprite，
 * 页面里改用 <use href="/icons.svg#i-xxx"> 引用，避免每页重复内联 path 数据。
 *
 * 用法：npm run icons（构建与 dev 前会自动执行）
 */
import fs from "node:fs";
import path from "node:path";
import { iconPaths } from "../src/shared/ui/icon-data";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "public/icons.svg");

/** 与 Icon.astro 保持同一套命名规则 */
const kebab = (name: string) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();

/** 品牌图标：viewBox 与 lucide 不同，单独维护 */
const brandIcons: Record<string, { viewBox: string; body: string }> = {
  github: {
    viewBox: "0 0 1024 1024",
    body: fs
      .readFileSync(path.join(ROOT, "src/shared/ui/github-path.txt"), "utf8")
      .trim(),
  },
};

const symbols: string[] = [];

for (const [name, body] of Object.entries(iconPaths)) {
  symbols.push(`  <symbol id="i-${kebab(name)}" viewBox="0 0 24 24">${body}</symbol>`);
}

for (const [name, icon] of Object.entries(brandIcons)) {
  symbols.push(`  <symbol id="i-${name}" viewBox="${icon.viewBox}">${icon.body}</symbol>`);
}

const sprite = `<svg xmlns="http://www.w3.org/2000/svg">
${symbols.join("\n")}
</svg>
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, sprite);

const bytes = Buffer.byteLength(sprite);
console.log(
  `icons.svg 已生成：${symbols.length} 个图标，${(bytes / 1024).toFixed(1)}KB`,
);
