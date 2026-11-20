import type { APIRoute } from "astro";
import { buildUrlSet, getThemeSitemapUrls } from "@/shared/seo/sitemap";

export const GET: APIRoute = () =>
  new Response(buildUrlSet(getThemeSitemapUrls()), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
