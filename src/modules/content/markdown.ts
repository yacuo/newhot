import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import remarkParse from "remark-parse";
import rehypeStringify from "rehype-stringify";
import type { TableOfContentsItem } from "./schema";

const headingPattern = /^(#{2,4})\s+(.+)$/gm;

function normalizeMarkdownHeadings(markdown: string) {
  let inCodeBlock = false;

  return markdown
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inCodeBlock = !inCodeBlock;
        return line;
      }

      if (!inCodeBlock && /^#(?!#)\s+/.test(line)) {
        return line.replace(/^#\s+/, "## ");
      }

      return line;
    })
    .join("\n");
}

function createHeadingId(text: string) {
  return text
    .toLowerCase()
    .replace(/[`*_~#[\]()]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fa5-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * 从 Markdown 二级到四级标题中提取文章目录。
 */
export function extractHeadings(markdown: string): TableOfContentsItem[] {
  const normalizedMarkdown = normalizeMarkdownHeadings(markdown);
  const headings: TableOfContentsItem[] = [];
  let match: RegExpExecArray | null;

  headingPattern.lastIndex = 0;

  while ((match = headingPattern.exec(normalizedMarkdown))) {
    const hashes = match[1];
    const text = match[2].trim();
    const level = hashes.length as 2 | 3 | 4;

    headings.push({
      id: createHeadingId(text),
      text,
      level,
    });
  }

  return headings;
}

/**
 * 构建期把 Markdown 转成 HTML。
 */
export async function markdownToHtml(markdown: string) {
  const normalizedMarkdown = normalizeMarkdownHeadings(markdown);
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: "wrap" })
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .process(normalizedMarkdown);

  return String(file);
}
