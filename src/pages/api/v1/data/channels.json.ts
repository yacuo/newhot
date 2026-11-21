import type { APIRoute } from "astro";
import { buildChannelIndex } from "@/shared/api/dataset";
import { internalJson } from "@/shared/api/internal";

/** 频道与二级分类的机器可读清单 */
export const GET: APIRoute = async () => {
  return internalJson(buildChannelIndex());
};
