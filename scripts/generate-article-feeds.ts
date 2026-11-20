import fs from "node:fs";
import path from "node:path";
import type { FeedMeta, HomeFeed } from "@/modules/content/schema";
import { HOME_TIERS, LIST_INITIAL_SIZE } from "@/modules/content/list-shards";
import { getCompany } from "@/modules/vendor/model";
import { readArticleItems } from "./lib/article-items";

/** 子公司文章同时计入母公司统计：字节跳动页面要能看到 TRAE 的动态 */
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
const outputDir = path.join(rootDir, "public", "data", "feed");

function writeJson(filePath: string, data: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

// 全量数据不再落公开文件，这里每次重建，避免旧的 all.json 残留
fs.mkdirSync(outputDir, { recursive: true });
for (const entry of fs.readdirSync(outputDir, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith(".json")) {
    fs.unlinkSync(path.join(outputDir, entry.name));
  }
}

const posts = readArticleItems();
const generatedAt = new Date().toISOString();

function bump(
  record: Record<string, { count: number; latest: string; latestPublished: string }>,
  key: string,
  date: string,
  publishedAt: string,
) {
  const entry = record[key];

  if (entry) {
    entry.count += 1;
    if (date > entry.latest) entry.latest = date;
    if (publishedAt > entry.latestPublished) entry.latestPublished = publishedAt;
  } else {
    record[key] = { count: 1, latest: date, latestPublished: publishedAt };
  }
}

const meta: FeedMeta = {
  generatedAt,
  total: posts.length,
  latest: posts[0]?.date ?? null,
  latestPublished: posts.reduce<string | null>(
    (latest, post) => (!latest || post.publishedAt > latest ? post.publishedAt : latest),
    null,
  ),
  channels: {},
  subcategories: {},
  companies: {},
};

for (const post of posts) {
  bump(meta.channels, post.category, post.date, post.publishedAt);

  if (post.subcategory) {
    bump(meta.subcategories, `${post.category}/${post.subcategory}`, post.date, post.publishedAt);
  }

  if (!post.company) continue;

  for (const companyId of companyScopeIds(post.company)) {
    const company = meta.companies[companyId];

    if (company) {
      company.count += 1;
      if (post.type === "release") company.releaseCount += 1;
      if (!company.channels.includes(post.category)) company.channels.push(post.category);
      if (post.date > company.latest) company.latest = post.date;
      if (post.publishedAt > company.latestPublished) company.latestPublished = post.publishedAt;
    } else {
      meta.companies[companyId] = {
        count: 1,
        releaseCount: post.type === "release" ? 1 : 0,
        channels: [post.category],
        latest: post.date,
        latestPublished: post.publishedAt,
      };
    }
  }
}

/** 首页只带各层级的首批条目，其余层级切 tab 时再按需拉分片 */
const home: HomeFeed = {
  generatedAt,
  tiers: Object.fromEntries(
    HOME_TIERS.map((tier) => {
      const list = tier === "all" ? posts : posts.filter((post) => post.companyTier === tier);

      return [
        tier,
        {
          total: list.length,
          latest: list[0]?.date ?? null,
          initial: tier === "all" ? list.slice(0, LIST_INITIAL_SIZE) : [],
        },
      ];
    }),
  ) as HomeFeed["tiers"],
};

writeJson(path.join(outputDir, "home.json"), home);
writeJson(path.join(outputDir, "meta.json"), meta);

console.log(
  `[content:feed] home.json（4 个层级首批 ${LIST_INITIAL_SIZE} 条）、meta.json（${posts.length} 篇统计）→ public/data/feed`,
);
