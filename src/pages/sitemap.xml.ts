import type { APIRoute } from "astro";
import { getAllPosts } from "@/entities/article/model";
import { buildSitemapIndex, getSitemapIndexEntries } from "@/shared/seo/sitemap";

export const GET: APIRoute = async () => {
  const posts = await getAllPosts();

  return new Response(buildSitemapIndex(getSitemapIndexEntries(posts)), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
};
