import type { APIRoute } from "astro";
import { getAllPosts } from "@/modules/content";
import { buildUrlSet, getTutorialSitemapUrls } from "@/shared/seo/sitemap";

export const GET: APIRoute = async () => {
  const posts = await getAllPosts();
  return new Response(buildUrlSet(getTutorialSitemapUrls(posts)), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
};
