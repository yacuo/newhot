import type { APIRoute } from "astro";
import { buildUrlSet, getCoreSitemapUrls } from "@/shared/seo/sitemap";

export const GET: APIRoute = () =>
  new Response(buildUrlSet(getCoreSitemapUrls()), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
