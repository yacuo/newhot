import type { APIRoute } from "astro";
import { getSiteUrl } from "@/shared/config/site";

export const GET: APIRoute = () => {
  const body =
    process.env.SITE_NOINDEX === "1"
      ? "User-agent: *\nDisallow: /\n"
      : `User-agent: *\nAllow: /\n\nSitemap: ${getSiteUrl("/sitemap.xml")}\n`;

  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
};
