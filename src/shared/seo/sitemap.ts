import { getResolvedTutorialCatalogs } from "@/modules/tutorial";
import type { Post } from "@/modules/content";
import { updateLogEntries } from "@/modules/page-content/update-log";
import { getSiteUrl } from "../site";
import { topics } from "@/modules/channel";
import { companies, companyHref } from "@/modules/vendor/model";
import { themes, themeHref } from "@/modules/vendor/themes";

export type SitemapUrl = {
  loc: string;
  lastmod?: string;
};

const STATIC_LASTMOD = "2026-06-24";

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function serializeUrl(url: SitemapUrl) {
  return [
    "  <url>",
    `    <loc>${xmlEscape(url.loc)}</loc>`,
    url.lastmod ? `    <lastmod>${xmlEscape(url.lastmod)}</lastmod>` : null,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildUrlSet(urls: SitemapUrl[]) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(serializeUrl),
    "</urlset>",
    "",
  ].join("\n");
}

export function buildSitemapIndex(entries: Array<{ loc: string; lastmod?: string }>) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((entry) =>
      [
        "  <sitemap>",
        `    <loc>${xmlEscape(entry.loc)}</loc>`,
        entry.lastmod ? `    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>` : null,
        "  </sitemap>",
      ]
        .filter(Boolean)
        .join("\n"),
    ),
    "</sitemapindex>",
    "",
  ].join("\n");
}

/** 索引里的 lastmod 必须反映子图内最新的页面，否则爬虫会以为子图长期未更新 */
function latestLastmod(urls: SitemapUrl[]) {
  return urls.reduce(
    (latest, url) => (url.lastmod && url.lastmod > latest ? url.lastmod : latest),
    STATIC_LASTMOD,
  );
}

export function getSitemapIndexEntries(posts: Post[]) {
  return [
    { loc: getSiteUrl("/sitemaps/core.xml"), lastmod: latestLastmod(getCoreSitemapUrls()) },
    { loc: getSiteUrl("/sitemaps/categories.xml"), lastmod: latestLastmod(getCategorySitemapUrls()) },
    { loc: getSiteUrl("/sitemaps/tutorials.xml"), lastmod: latestLastmod(getTutorialSitemapUrls(posts)) },
    { loc: getSiteUrl("/sitemaps/themes.xml"), lastmod: latestLastmod(getThemeSitemapUrls()) },
    // 每个固定频道一个独立 sitemap，统一放在 channels 目录下，避免与 core/themes 等保留名冲突
    ...topics.map((topic) => ({
      loc: getSiteUrl(`/sitemaps/channels/${topic.id}.xml`),
      lastmod: latestLastmod(getChannelSitemapUrls(posts, topic.id)),
    })),
  ];
}

export function getCoreSitemapUrls(): SitemapUrl[] {
  return [
    { loc: getSiteUrl("/"), lastmod: STATIC_LASTMOD },
    { loc: getSiteUrl("/topics/"), lastmod: STATIC_LASTMOD },
    { loc: getSiteUrl("/companies/"), lastmod: STATIC_LASTMOD },
    { loc: getSiteUrl("/tutorials/"), lastmod: STATIC_LASTMOD },
    // 厂商详情页统一放进 themes.xml，与主题一起聚合，不在 core.xml 里重复出现
    { loc: getSiteUrl("/open-source/"), lastmod: STATIC_LASTMOD },
    { loc: getSiteUrl("/about/"), lastmod: STATIC_LASTMOD },
    { loc: getSiteUrl("/update-log/"), lastmod: STATIC_LASTMOD },
    // 每条版本日志都是独立落地页，之前漏收录
    ...updateLogEntries.map((entry) => ({
      loc: getSiteUrl(`/update-log/${entry.slug}/`),
      lastmod: entry.date,
    })),
    { loc: getSiteUrl("/contribute/"), lastmod: STATIC_LASTMOD },
    { loc: getSiteUrl("/contact/"), lastmod: STATIC_LASTMOD },
    { loc: getSiteUrl("/privacy/"), lastmod: STATIC_LASTMOD },
    { loc: getSiteUrl("/cookies/"), lastmod: STATIC_LASTMOD },
    { loc: getSiteUrl("/do-not-sell/"), lastmod: STATIC_LASTMOD },
    { loc: getSiteUrl("/terms/"), lastmod: STATIC_LASTMOD },
  ];
}

export function getThemeSitemapUrls(): SitemapUrl[] {
  return [
    { loc: getSiteUrl("/themes/"), lastmod: STATIC_LASTMOD },
    ...themes.map((theme) => ({
      loc: getSiteUrl(themeHref(theme.id)),
      lastmod: STATIC_LASTMOD,
    })),
    // 主题页下面挂着厂商列表，这里把厂商详情页一起聚合进来
    ...companies.map((company) => ({
      loc: getSiteUrl(companyHref(company.id)),
      lastmod: STATIC_LASTMOD,
    })),
  ];
}

export function getCategorySitemapUrls(): SitemapUrl[] {
  return topics.flatMap((topic) => [
    { loc: getSiteUrl(`/${topic.id}/`), lastmod: STATIC_LASTMOD },
    ...topic.subcategories.map((subcategory) => ({
      loc: getSiteUrl(`/${topic.id}/${subcategory.id}/`),
      lastmod: STATIC_LASTMOD,
    })),
  ]);
}

export function getTutorialSitemapUrls(posts: Post[]): SitemapUrl[] {
  const catalogs = getResolvedTutorialCatalogs(posts);

  return catalogs.flatMap((catalog) => [
    { loc: getSiteUrl(`/tutorials/${catalog.id}/`), lastmod: STATIC_LASTMOD },
    ...catalog.sections.flatMap((section) =>
      section.articles
        .filter((article) => !article.external && article.slug && article.href.startsWith(`/${catalog.id}/`))
        .map((article) => ({
          loc: getSiteUrl(article.href),
          lastmod: article.post?.updated ?? article.post?.date ?? STATIC_LASTMOD,
        })),
    ),
  ]);
}

/** 教程文章由 tutorials.xml 负责收录，不重复进入频道图 */
function isChannelPost(post: Post) {
  return !post.sourcePath.includes("/data/tutorials/");
}

export function getChannelSitemapUrls(posts: Post[], channelId: string): SitemapUrl[] {
  return posts
    .filter(isChannelPost)
    .filter((post) => post.category === channelId)
    .map((post) => ({
      loc: getSiteUrl(post.href),
      lastmod: post.updated ?? post.date,
    }));
}
