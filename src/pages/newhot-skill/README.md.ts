import type { APIRoute } from "astro";

const readme = `# NewHot — Agent Skill

让支持 Agent Skills（\`SKILL.md\`）的工具用中文查询 [NewHot](https://newhot.org)：AI 大模型新闻、模型发布、API 价格与上下文、AI 编程、AI 办公、AI 创作和厂商故障排查。

**装一次就好。** 这个 Skill 只告诉 Agent 去哪里取数、怎么筛选和引用；站点新增能力不需要更新 Skill。接口匿名、只读，不需要 API Key。

## 安装前可审阅

- [SKILL.md](https://newhot.org/newhot-skill/SKILL.md)
- [页面预览](https://newhot.org/agent/skill/)
- [OpenAPI 3.1](https://newhot.org/openapi-v1.json)
- [GitHub](https://github.com/yacuo/newhot)

## 让 Agent 安装

把这句话发给你的 Agent：

\`请安装 NewHot Skill：https://newhot.org/newhot-skill/README.md\`

给 Agent 的做法：

- 能运行 Bash（macOS、Linux、WSL）：用下面的命令，装到 Claude Code 或通用 Agent Skills 目录。
- 不能运行 Bash（Windows 原生）：不要把 Bash 命令粘到 PowerShell。用联网读取工具打开 [SKILL.md](https://newhot.org/newhot-skill/SKILL.md)，保存为当前 Agent 实际读取的 \`skills/newhot/SKILL.md\`。

## 命令行安装

Claude Code：

\`\`\`bash
mkdir -p ~/.claude/skills/newhot
curl -fsSL https://newhot.org/newhot-skill/SKILL.md -o ~/.claude/skills/newhot/SKILL.md
\`\`\`

通用目录（Codex、Gemini CLI、GitHub Copilot、OpenCode 共用）：

\`\`\`bash
mkdir -p ~/.agents/skills/newhot
curl -fsSL https://newhot.org/newhot-skill/SKILL.md -o ~/.agents/skills/newhot/SKILL.md
\`\`\`

只有正文一个文件，没有安装脚本，也不写本地状态。

## 安装后验证

1. 重启 Agent 或开启新会话。
2. 让 Agent 列出它发现的 skills，确认只有一份 \`newhot\`。
3. 提问：\`过去 24 小时 AI 大模型最重要的 5 件事是什么？\`

成功的回答会写明时间范围，给出中文摘要，并把标题链接到 NewHot 站内页面。

## 能查询什么

- 最近 7 天的文章（只提供 7 天内，不返回历史全量）
- 最新或按频道查询文章：\`https://newhot.org/api/v1/articles?channel=llm&limit=20\`
- 按主题、主题分组、厂商、标签、类型、关键词、日期查询：\`https://newhot.org/api/v1/articles?theme=llm&group=cn&type=release&since=2026-11-01\`
- 全量快照：\`https://newhot.org/api/v1/articles/all\`
- 频道与二级分类：\`https://newhot.org/api/v1/channels\`
- 页面直达：\`/api/v1/channels/{channel}/articles\`、\`/api/v1/themes/{theme}/{group}/articles\`、\`/api/v1/vendors/{vendor}/articles\`
- 主题、厂商、标签索引：\`https://newhot.org/api/v1/themes\`、\`/api/v1/vendors\`、\`/api/v1/tags\`
- RSS：\`https://newhot.org/feed.xml\`，频道用 \`https://newhot.org/{channel}/feed.xml\`
- 远程 MCP：\`https://newhot.org/api/v1/mcp\`

主题页顶部的每个胶囊对应一个 \`group\`，例如 \`theme=llm&group=global\` 是海外模型厂商、\`theme=llm&group=cn\` 是中国模型厂商。

更完整的筛选与引用规则见 [SKILL.md](https://newhot.org/newhot-skill/SKILL.md)。

## 不装 Skill 也能用

- 让 Agent 读 \`https://newhot.org/api/v1/agent-skill\`，按里面的说明查询。
- 支持远程 MCP 的客户端接 \`https://newhot.org/api/v1/mcp\`。
- 阅读器订阅 \`https://newhot.org/feed.xml\`。

## 许可

Skill 指令适用 [NewHot 服务条款](https://newhot.org/terms/)。接口返回的标题、摘要与来源归原作者，引用时链接 canonical 页面。
`;

export const GET: APIRoute = async () =>
  new Response(readme, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
      "X-Robots-Tag": "noindex",
    },
  });
