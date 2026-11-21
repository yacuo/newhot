/** 内部数据文件只给 Worker 读取，构建产物统一 noindex，不带 CORS */
export function internalJson(body: unknown) {
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=60",
      "X-Robots-Tag": "noindex",
    },
  });
}
