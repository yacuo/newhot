import type { APIRoute } from "astro";
import { buildArticleIndex } from "@/shared/api/dataset";
import { internalJson } from "@/shared/api/internal";

/** 全量文章核心字段 + 内部筛选字段；外部响应由 Worker 剥掉 company / tags / type */
export const GET: APIRoute = async () => {
  return internalJson(await buildArticleIndex());
};
