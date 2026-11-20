export type SourceLink = {
  name: string;
  href: string;
};

/** 通用官方渠道：默认用于没有单独配置的频道 */
export const DEFAULT_SOURCES: SourceLink[] = [
  { name: "OpenAI News", href: "https://openai.com/news/" },
  { name: "Anthropic News", href: "https://www.anthropic.com/news" },
  { name: "Google DeepMind Blog", href: "https://deepmind.google/discover/blog/" },
  { name: "Meta AI Blog", href: "https://ai.meta.com/blog/" },
  { name: "Hugging Face Blog", href: "https://huggingface.co/blog" },
];

/** 按频道给出更贴近的官方来源，未配置的频道回退到 DEFAULT_SOURCES */
export const CHANNEL_SOURCES: Record<string, SourceLink[]> = {
  llm: [
    { name: "OpenAI News", href: "https://openai.com/news/" },
    { name: "Anthropic News", href: "https://www.anthropic.com/news" },
    { name: "Google DeepMind Blog", href: "https://deepmind.google/discover/blog/" },
    { name: "Meta AI Blog", href: "https://ai.meta.com/blog/" },
    { name: "Mistral AI News", href: "https://mistral.ai/news/" },
  ],
  "ai-coding": [
    { name: "GitHub Changelog", href: "https://github.blog/changelog/" },
    { name: "VS Code Updates", href: "https://code.visualstudio.com/updates" },
    { name: "Hugging Face Blog", href: "https://huggingface.co/blog" },
  ],
  "ai-office": [
    { name: "Google Workspace Updates", href: "https://workspaceupdates.googleblog.com/" },
    { name: "Microsoft 365 Blog", href: "https://www.microsoft.com/en-us/microsoft-365/blog/" },
    { name: "Notion Releases", href: "https://www.notion.com/releases" },
  ],
  "ai-creation": [
    { name: "OpenAI News", href: "https://openai.com/news/" },
    { name: "Adobe Blog", href: "https://blog.adobe.com/" },
    { name: "Hugging Face Blog", href: "https://huggingface.co/blog" },
  ],
};

export function getChannelSources(topicId?: string | null) {
  return (topicId && CHANNEL_SOURCES[topicId]) || DEFAULT_SOURCES;
}

/** 系列教程页的来源：以官方文档为主，避免引用二手教程 */
export const TUTORIAL_SOURCES: SourceLink[] = [
  { name: "MDN Web Docs", href: "https://developer.mozilla.org/" },
  { name: "React 官方文档", href: "https://react.dev/" },
  { name: "Next.js 文档", href: "https://nextjs.org/docs" },
  { name: "LangChain 文档", href: "https://python.langchain.com/" },
  { name: "Vite 文档", href: "https://vite.dev/" },
];
