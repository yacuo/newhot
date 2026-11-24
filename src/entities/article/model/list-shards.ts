/**
 * 文章列表分片参数。生成脚本与客户端组件共用，改一处即可。
 *
 * 单分片 50 条约 20KB（gzip 后约 6KB）：
 * - 静态托管时，单个文件小、缓存命中快，不会一次拉全量；
 * - 1000 条也只有 20 个分片，每个分片只在滚到附近时才请求。
 */
export const LIST_SHARD_SIZE = 50;

/** 首屏渲染条数：只渲染前 20 条，保证首屏速度 */
export const LIST_INITIAL_SIZE = 20;

/** 滚动触发后每次追加的条数 */
export const LIST_PAGE_SIZE = 2;

/** 首页按公司层级分流，对应分片目录 _latest/<tier>/ */
export const HOME_TIERS = ["all", "model", "tool", "infra"] as const;

export type HomeTier = (typeof HOME_TIERS)[number];
