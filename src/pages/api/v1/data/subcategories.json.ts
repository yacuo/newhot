import type { APIRoute } from "astro";
import { buildSubcategoryIndex } from "@/shared/api/dataset";
import { internalJson } from "@/shared/api/internal";

/** 扁平二级分类清单，Worker 按 channel 过滤后对外 */
export const GET: APIRoute = async () => {
  return internalJson(await buildSubcategoryIndex());
};
