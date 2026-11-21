import type { Post } from "@/modules/content/schema";
import { getSiteUrl } from "@/shared/site";

/** 对外 API 只给核心字段和摘要，不返回标签、来源清单或正文 */
export type ApiArticle = {
  id: string;
  title: string;
  description: string;
  url: string;
  channel: string;
  subcategory?: string;
  publishedAt: string;
};

export const sortPostsByPublished = (posts: Post[]) =>
  posts
    .slice()
    .sort(
      (left, right) =>
        right.publishedAt.localeCompare(left.publishedAt) ||
        right.date.localeCompare(left.date) ||
        (right.time ?? "").localeCompare(left.time ?? ""),
    );

export function toApiArticle(post: Post): ApiArticle {
  return {
    id: `${post.subcategory}/${post.slug}`,
    title: post.title,
    description: post.description,
    url: getSiteUrl(post.href),
    channel: post.category,
    subcategory: post.subcategory,
    publishedAt: post.publishedAt,
  };
}
