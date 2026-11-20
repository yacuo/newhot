import type { APIRoute } from "astro";
import { buildUrlSet, getCategorySitemapUrls } from "@/shared/seo/sitemap";

export const GET: APIRoute = () =>
  new Response(buildUrlSet(getCategorySitemapUrls()), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
