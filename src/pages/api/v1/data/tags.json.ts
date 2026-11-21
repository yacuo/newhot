import type { APIRoute } from "astro";
import { buildTagIndex } from "@/shared/api/dataset";
import { internalJson } from "@/shared/api/internal";

/** 标签索引，按文章数从多到少 */
export const GET: APIRoute = async () => {
  return internalJson(await buildTagIndex());
};
