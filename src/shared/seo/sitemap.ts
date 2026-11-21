import { getResolvedTutorialCatalogs } from "@/modules/tutorial";
import { readFeedMeta, type Post } from "@/modules/content";
import { updateLogEntries } from "@/modules/page-content/update-log";
import { getSiteUrl } from "../site";
import { topics } from "@/modules/channel";
import { companies, companyHref } from "@/modules/vendor/model";
import { getThemeCompanyIds, themes, themeGroupHref, themeHref } from "@/modules/vendor/themes";

export type SitemapUrl = {
  loc: string;
  lastmod?: string;
};

/** 兜底日期：内容数据缺失时用构建当天，避免 sitemap 出现过期时间 */
const BUILD_LASTMOD = new Date().toISOString().slice(0, 10);

/** 全站内容的最新发布日期：所有聚合页与静态页的 lastmod 以它为基准 */
function contentLatest() {
  const meta = readFeedMeta();

  return meta?.latestPublished ?? meta?.latest ?? BUILD_LASTMOD;
}

/** 一组公司里最新的站内发布日期；没有任何动态时退回全站最新日期 */
function latestOfCompanies(companyIds: string[]) {
  const stats = readFeedMeta()?.companies;
  const latest = companyIds.reduce((max, id) => {
    const value = stats?.[id]?.latestPublished;
    return value && value > max ? value : max;
  }, "");

  return latest || contentLatest();
}

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
    contentLatest(),
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
  const latest = contentLatest();
  const logLatest = updateLogEntries[0]?.date ?? latest;

  return [
    { loc: getSiteUrl("/"), lastmod: latest },
    { loc: getSiteUrl("/topics/"), lastmod: latest },
    { loc: getSiteUrl("/companies/"), lastmod: latest },
    { loc: getSiteUrl("/tutorials/"), lastmod: latest },
    // 厂商详情页统一放进 themes.xml，与主题一起聚合，不在 core.xml 里重复出现
    { loc: getSiteUrl("/open-source/"), lastmod: latest },
    { loc: getSiteUrl("/about/"), lastmod: latest },
    { loc: getSiteUrl("/agent/"), lastmod: latest },
    { loc: getSiteUrl("/agent/rss/"), lastmod: latest },
    { loc: getSiteUrl("/agent/api/"), lastmod: latest },
    { loc: getSiteUrl("/agent/mcp/"), lastmod: latest },
    { loc: getSiteUrl("/agent/skill/"), lastmod: latest },
    { loc: getSiteUrl("/update-log/"), lastmod: logLatest },
    // 每条版本日志都是独立落地页，之前漏收录
    ...updateLogEntries.map((entry) => ({
      loc: getSiteUrl(`/update-log/${entry.slug}/`),
      lastmod: entry.date,
    })),
    { loc: getSiteUrl("/contribute/"), lastmod: latest },
    { loc: getSiteUrl("/contact/"), lastmod: latest },
    { loc: getSiteUrl("/privacy/"), lastmod: latest },
    { loc: getSiteUrl("/cookies/"), lastmod: latest },
    { loc: getSiteUrl("/do-not-sell/"), lastmod: latest },
    { loc: getSiteUrl("/terms/"), lastmod: latest },
  ];
}

export function getThemeSitemapUrls(): SitemapUrl[] {
  const stats = readFeedMeta()?.companies;

  return [
    { loc: getSiteUrl("/themes/"), lastmod: latestOfCompanies(companies.map((company) => company.id)) },
    ...themes.flatMap((theme) => {
      const themeLatest = latestOfCompanies(getThemeCompanyIds(theme));

      return [
        { loc: getSiteUrl(themeHref(theme.id)), lastmod: themeLatest },
        ...theme.groups.map((group) => ({
          loc: getSiteUrl(themeGroupHref(theme.id, group.id)),
          lastmod: latestOfCompanies(group.companyIds),
        })),
      ];
    }),
    // 主题页下面挂着厂商列表，这里把厂商详情页一起聚合进来
    ...companies.map((company) => ({
      loc: getSiteUrl(companyHref(company.id)),
      lastmod: stats?.[company.id]?.latestPublished ?? contentLatest(),
    })),
  ];
}

export function getCategorySitemapUrls(): SitemapUrl[] {
  const meta = readFeedMeta();

  return topics.flatMap((topic) => {
    const channelLatest = meta?.channels[topic.id]?.latestPublished ?? contentLatest();

    return [
      { loc: getSiteUrl(`/${topic.id}/`), lastmod: channelLatest },
      ...topic.subcategories.map((subcategory) => ({
        loc: getSiteUrl(`/${topic.id}/${subcategory.id}/`),
        lastmod: meta?.subcategories[`${topic.id}/${subcategory.id}`]?.latestPublished ?? channelLatest,
      })),
    ];
  });
}

export function getTutorialSitemapUrls(posts: Post[]): SitemapUrl[] {
  const catalogs = getResolvedTutorialCatalogs(posts);

  return catalogs.flatMap((catalog) => {
    const articles = catalog.sections.flatMap((section) =>
      section.articles
        .filter((article) => !article.external && article.slug && article.href.startsWith(`/${catalog.id}/`))
        .map((article) => ({
          loc: getSiteUrl(article.href),
          lastmod:
            article.post?.updated && article.post.updated > (article.post.publishedAt ?? "")
              ? article.post.updated
              : (article.post?.publishedAt ?? contentLatest()),
        })),
    );
    const catalogLatest = articles.reduce(
      (latest, article) => (article.lastmod && article.lastmod > latest ? article.lastmod : latest),
      contentLatest(),
    );

    return [{ loc: getSiteUrl(`/tutorials/${catalog.id}/`), lastmod: catalogLatest }, ...articles];
  });
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
      lastmod: post.updated && post.updated > post.publishedAt ? post.updated : post.publishedAt,
    }));
}
