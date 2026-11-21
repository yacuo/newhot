import type { APIRoute } from "astro";
import { topics, type Topic } from "@/modules/channel";
import { rssResponse } from "@/shared/seo/rss";
import { buildChannelFeed } from "@/shared/seo/rss-feeds";

export function getStaticPaths() {
  return topics.map((topic) => ({
    params: { slug: topic.id },
    props: { topic },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { topic } = props as { topic: Topic };
  return rssResponse(await buildChannelFeed(topic));
};
