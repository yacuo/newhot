import fs from "node:fs";
import path from "node:path";
import type { APIRoute } from "astro";
import { renderAgentDoc } from "@/shared/lib/agent-doc";

/** /newhot-skill/SKILL.md 是 /api/v1/agent-skill 的易读别名，内容一致 */
export const GET: APIRoute = async () => {
  const markdown = renderAgentDoc(
    fs.readFileSync(path.join(process.cwd(), "src", "shared", "content", "agent-skill.md"), "utf8")
  );

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
      "X-Robots-Tag": "noindex",
    },
  });
};
