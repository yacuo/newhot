import type { APIRoute } from "astro";
import { buildVendorIndex } from "@/shared/api/dataset";
import { internalJson } from "@/shared/api/internal";

/** 厂商清单，带主题归属与文章统计；Worker 按 tier / theme 过滤后对外 */
export const GET: APIRoute = async () => {
  return internalJson(await buildVendorIndex());
};
