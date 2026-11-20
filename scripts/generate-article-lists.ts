import fs from "node:fs";
import path from "node:path";
import { HOME_TIERS, LIST_SHARD_SIZE } from "@/modules/content/list-shards";
import type { ArticleListItem, ListManifest } from "@/modules/content/schema";
import { getCompany } from "@/modules/vendor/model";
import { readArticleItems } from "./lib/article-items";

/** 子公司文章同时进入母公司列表：字节跳动页面要能看到 TRAE 的动态 */
function companyScopeIds(companyId: string) {
  const ids = [companyId];
  let parentId = getCompany(companyId)?.parentId;

  while (parentId) {
    ids.push(parentId);
    parentId = getCompany(parentId)?.parentId;
  }

  return ids;
}

const rootDir = process.cwd();
const outputDir = path.join(rootDir, "public", "data", "lists");

/** scope 与页面一一对应：频道 llm、分类 llm/pricing、首页层级 _latest/model、公司 _companies/openai */
const groups = new Map<string, ArticleListItem[]>();

function push(scope: string, item: ArticleListItem) {
  const list = groups.get(scope);

  if (list) {
    list.push(item);
  } else {
    groups.set(scope, [item]);
  }
}

const posts = readArticleItems();

for (const item of posts) {
  push(item.category, item);

  if (item.subcategory) {
    push(`${item.category}/${item.subcategory}`, item);
  }

  if (item.companyTier) {
    push(`_latest/${item.companyTier}`, item);
  }

  if (item.company) {
    for (const companyId of companyScopeIds(item.company)) {
      push(`_companies/${companyId}`, item);
    }
  }
}

groups.set("_latest/all", posts);

function writeJson(filePath: string, data: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data)}\n`);
}

// 全量重建，避免已删分类 / 公司残留旧分片
fs.rmSync(outputDir, { recursive: true, force: true });

let shardCount = 0;

for (const [scope, items] of groups) {
  const scopeDir = path.join(outputDir, ...scope.split("/"));
  const shards = Math.ceil(items.length / LIST_SHARD_SIZE);

  writeJson(path.join(scopeDir, "index.json"), {
    scope,
    total: items.length,
    shardSize: LIST_SHARD_SIZE,
    shards,
  });

  for (let page = 1; page <= shards; page += 1) {
    const start = (page - 1) * LIST_SHARD_SIZE;
    writeJson(path.join(scopeDir, `${page}.json`), {
      scope,
      page,
      shardSize: LIST_SHARD_SIZE,
      total: items.length,
      items: items.slice(start, start + LIST_SHARD_SIZE),
    });
    shardCount += 1;
  }
}

const manifest: ListManifest = {
  generatedAt: new Date().toISOString(),
  channels: [...new Set(posts.map((post) => post.category))].sort(),
  tiers: [...HOME_TIERS],
  companies: [...new Set(posts.map((post) => post.company).filter((id): id is string => Boolean(id)))].sort(),
};

writeJson(path.join(outputDir, "index.json"), manifest);

console.log(
  `[content:lists] ${groups.size} 个列表 → ${shardCount} 个分片（每片 ${LIST_SHARD_SIZE} 条）→ public/data/lists`,
);
