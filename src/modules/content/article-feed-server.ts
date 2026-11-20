import fs from "node:fs";
import path from "node:path";
import type { ArticleListItem, FeedMeta, HomeFeed, ListManifest, ListShard } from "./schema";
import { PUBLIC_DATA_DIR } from "./paths";

const dataDir = PUBLIC_DATA_DIR;

const cache = new Map<string, unknown>();

function readJson<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function readCached<T>(key: string, filePath: string): T | null {
  if (cache.has(key)) {
    return cache.get(key) as T | null;
  }

  const value = readJson<T>(filePath);
  cache.set(key, value);

  return value;
}

/** 列表分片的 scope 只允许字母数字与连字符，避免拼路径时越界 */
function isValidScope(scope: string) {
  return scope.split("/").every((segment) => /^[a-z0-9_-]+$/i.test(segment));
}

/** 首页数据：置顶 + 各层级首批条目；没有全站全量 feed */
export function readHomeFeed() {
  return readCached<HomeFeed>("home", path.join(dataDir, "feed", "home.json"));
}

/** 频道 / 分类 / 公司的计数与最新日期 */
export function readFeedMeta() {
  return readCached<FeedMeta>("meta", path.join(dataDir, "feed", "meta.json"));
}

/** 分片清单：频道、首页层级、公司 */
export function readListManifest() {
  return readCached<ListManifest>("list-manifest", path.join(dataDir, "lists", "index.json"));
}

export function readListShard(scope: string, page = 1) {
  if (!isValidScope(scope)) {
    return null;
  }

  return readJson<ListShard>(path.join(dataDir, "lists", ...scope.split("/"), `${page}.json`));
}

/** 构建期按需读取某个列表的全部分片（公司页、发展史这类需要完整数据的场景） */
export function readListItems(scope: string): ArticleListItem[] {
  if (!isValidScope(scope)) {
    return [];
  }

  const scopeDir = path.join(dataDir, "lists", ...scope.split("/"));
  const index = readJson<{ shards: number }>(path.join(scopeDir, "index.json"));

  if (!index) {
    return [];
  }

  const items: ArticleListItem[] = [];

  for (let page = 1; page <= index.shards; page += 1) {
    const shard = readJson<ListShard>(path.join(scopeDir, `${page}.json`));
    if (shard) items.push(...shard.items);
  }

  return items;
}
