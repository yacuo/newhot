import type { APIRoute } from "astro";
import { buildThemeIndex } from "@/shared/api/dataset";
import { internalJson } from "@/shared/api/internal";

/** 厂商主题与分组，带文章统计 */
export const GET: APIRoute = async () => {
  return internalJson(await buildThemeIndex());
};
