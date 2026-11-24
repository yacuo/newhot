import type { APIRoute } from "astro";
import { getAllPosts } from "@/entities/article/model";
import { topics } from "@/entities/channel/model";
import { buildUrlSet, getChannelSitemapUrls } from "@/shared/seo/sitemap";

export function getStaticPaths() {
  return topics.map((topic) => ({ params: { channel: topic.id } }));
}

export const GET: APIRoute = async ({ params }) => {
  const channel = params.channel;

  if (!channel || !topics.some((topic) => topic.id === channel)) {
    return new Response("Not Found", { status: 404 });
  }

  const posts = await getAllPosts();

  return new Response(buildUrlSet(getChannelSitemapUrls(posts, channel)), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
};
