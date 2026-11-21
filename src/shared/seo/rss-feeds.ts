import { getAllPosts } from "@/modules/content";
import { getTopicLabel, type Topic } from "@/modules/channel";
import { buildRssFeed, rssFeedTitle } from "./rss";
import { siteConfig } from "../site";

const WINDOW_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;

/** RSS 和接口保持一致：只发最近 7 天的文章（按北京时间算窗口） */
function withinWindow<T extends { publishedAt: string }>(posts: T[]): T[] {
  const since = new Date(Date.now() + BEIJING_OFFSET_MS - WINDOW_DAYS * DAY_MS).toISOString().slice(0, 10);
  return posts.filter((post) => post.publishedAt >= since);
}

/** 全站 RSS；/feed.xml 使用这份内容 */
export async function buildAllFeed() {
  const posts = withinWindow(await getAllPosts());

  return buildRssFeed({
    title: rssFeedTitle(),
    description: siteConfig.description,
    path: "/feed.xml",
    items: posts.map((post) => ({
      title: post.title,
      link: post.href,
      description: post.description,
      publishedAt: post.publishedAt,
      category: getTopicLabel(post.category),
    })),
  });
}

/** 频道 RSS；/<channel>/feed.xml 使用这份内容 */
export async function buildChannelFeed(topic: Topic) {
  const posts = withinWindow((await getAllPosts()).filter((post) => post.category === topic.id));

  return buildRssFeed({
    title: rssFeedTitle(topic.label),
    description: topic.description,
    path: `/${topic.id}/feed.xml`,
    items: posts.map((post) => ({
      title: post.title,
      link: post.href,
      description: post.description,
      publishedAt: post.publishedAt,
    })),
  });
}
