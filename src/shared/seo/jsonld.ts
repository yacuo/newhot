import { getSiteUrl, siteConfig } from "../config/site";

type ListItem = {
  title: string;
  href: string;
  description?: string;
  /** 站内发布日期：AI 写稿当天创建文章的日期 */
  publishedAt: string;
  author?: string;
};

/** 列表页通用的 JSON-LD：CollectionPage + ItemList；带日期的条目按 Article 输出 */
export function buildCollectionJsonLd(options: {
  name: string;
  description: string;
  path: string;
  items: ListItem[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: options.name,
    description: options.description,
    url: getSiteUrl(options.path),
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: getSiteUrl("/"),
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: options.items.slice(0, 50).map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        ...(item.publishedAt
          ? {
              item: {
                "@type": "Article",
                headline: item.title,
                url: getSiteUrl(item.href),
                description: item.description,
                datePublished: item.publishedAt,
                author: {
                  "@type": "Organization",
                  name: item.author ?? `${siteConfig.name} 编辑部`,
                },
              },
            }
          : { name: item.title, url: getSiteUrl(item.href) }),
      })),
    },
  };
}

/** 面包屑 JSON-LD，按传入顺序从首页到当前页 */
export function buildBreadcrumbJsonLd(items: Array<{ name: string; href: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: getSiteUrl(item.href),
    })),
  };
}

/** 说明型页面（Agent 接入这类文档）的 JSON-LD：TechArticle，便于被当成技术文档引用 */
export function buildTechArticleJsonLd(options: {
  headline: string;
  description: string;
  path: string;
  section?: string;
  about?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: options.headline,
    description: options.description,
    url: getSiteUrl(options.path),
    mainEntityOfPage: { "@type": "WebPage", "@id": getSiteUrl(options.path) },
    inLanguage: siteConfig.language,
    articleSection: options.section ?? "Agent 接入",
    ...(options.about?.length
      ? { about: options.about.map((name) => ({ "@type": "Thing", name })) }
      : {}),
    author: {
      "@type": "Organization",
      name: `${siteConfig.name} 编辑部`,
      url: getSiteUrl("/about/"),
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: getSiteUrl("/"),
    },
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: getSiteUrl("/"),
    },
  };
}
