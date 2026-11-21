import type { APIRoute } from "astro";
import { rssResponse } from "@/shared/seo/rss";
import { buildAllFeed } from "@/shared/seo/rss-feeds";

export const GET: APIRoute = async () => rssResponse(await buildAllFeed());
