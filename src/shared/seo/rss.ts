import { getSiteUrl, siteConfig } from "../config/site";

export type RssItem = {
  title: string;
  link: string;
  description: string;
  /** 站内发布日期，YYYY-MM-DD */
  publishedAt: string;
  category?: string;
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    // 去掉 XML 1.0 不允许的控制字符
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

const toRfc822 = (day: string) => new Date(`${day}T00:00:00+08:00`).toUTCString();

/** 生成 RSS 2.0；只放摘要和 canonical 链接，不放正文 */
export function buildRssFeed(input: {
  title: string;
  description: string;
  path: string;
  items: RssItem[];
  limit?: number;
}) {
  const items = input.items
    .slice()
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
    .slice(0, input.limit ?? 100);
  const self = getSiteUrl(input.path);
  const lastBuildDate = items[0] ? toRfc822(items[0].publishedAt) : new Date().toUTCString();

  const itemXml = items
    .map((item) => {
      const link = getSiteUrl(item.link);
      return [
        "    <item>",
        `      <title>${escapeXml(item.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <pubDate>${toRfc822(item.publishedAt)}</pubDate>`,
        `      <description>${escapeXml(item.description)}</description>`,
        item.category ? `      <category>${escapeXml(item.category)}</category>` : "",
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(input.title)}</title>`,
    `    <link>${escapeXml(self.replace(/\/[^/]*$/, "/"))}</link>`,
    `    <description>${escapeXml(input.description)}</description>`,
    "    <language>zh-CN</language>",
    `    <lastBuildDate>${lastBuildDate}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(self)}" rel="self" type="application/rss+xml" />`,
    itemXml,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}

export const rssResponse = (xml: string) =>
  new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "X-Robots-Tag": "noindex",
    },
  });

export const rssFeedTitle = (suffix?: string) =>
  suffix ? `${siteConfig.name} · ${suffix}` : `${siteConfig.name} · AI 大模型新闻资讯`;
