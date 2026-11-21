import fs from "node:fs";
import path from "node:path";
import type { APIRoute } from "astro";

/** 机器可读的 Agent Skill 原文；无扩展名，显式声明 UTF-8，避免浏览器猜编码 */
export const GET: APIRoute = async () => {
  const markdown = fs.readFileSync(path.join(process.cwd(), "src", "content", "agent-skill.md"), "utf8");

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
      "X-Robots-Tag": "noindex",
    },
  });
};
