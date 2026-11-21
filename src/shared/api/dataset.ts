import { getAllPosts, readFeedMeta } from "@/modules/content";
import { subcategoryHref, topicHref, topics } from "@/modules/channel";
import { companies, companyHref, getCompany, resolveProduct } from "@/modules/vendor/model";
import { getThemeCompanyIds, themeGroupHref, themeHref, themes } from "@/modules/vendor/themes";
import { getSiteUrl } from "@/shared/site";
import { sortPostsByPublished, toApiArticle, type ApiArticle } from "./articles";

/** 内部数据集字段；对外响应会剥掉 company / tags / type / product，只留 ApiArticle */
export type DatasetArticle = ApiArticle & {
  company: string | null;
  tags: string[];
  type: string | null;
  /** 产品归属，形如 openai:gpt；没有命中产品时为 null */
  product: string | null;
};

export type DatasetSubcategory = {
  id: string;
  label: string;
  description: string;
  url: string;
  count: number;
  latestPublished: string | null;
  channel: string;
  channelLabel: string;
};

export type DatasetVendor = {
  id: string;
  name: string;
  tier: "model" | "tool" | "infra";
  region: "cn" | "global";
  homepage: string;
  primaryModel: string | null;
  products: Array<{ id: string; name: string }>;
  url: string;
  themes: string[];
  articleCount: number;
  latestPublished: string | null;
};

export type DatasetTheme = {
  id: string;
  name: string;
  eyebrow: string;
  description: string;
  url: string;
  companyCount: number;
  articleCount: number;
  latestPublished: string | null;
  groups: Array<{
    id: string;
    label: string;
    url: string;
    companyCount: number;
    companyIds: string[];
  }>;
};

export type DatasetTag = { tag: string; count: number };

export type DatasetType = { type: string; count: number };

export async function buildArticleIndex() {
  const posts = sortPostsByPublished(await getAllPosts());
  const items: DatasetArticle[] = posts.map((post) => {
    const company = post.company ? getCompany(post.company) : null;
    const product = company ? resolveProduct(company, post.tags, post.title) : null;

    return {
      ...toApiArticle(post),
      company: post.company ?? null,
      tags: post.tags,
      type: post.type ?? null,
      product: company && product ? `${company.id}:${product.id}` : null,
    };
  });

  return { generatedAt: new Date().toISOString(), total: items.length, items };
}

/** 频道与二级分类同一份来源，channels 与 subcategories 两个端点共用 */
export function buildChannelIndex() {
  const meta = readFeedMeta();

  return {
    generatedAt: new Date().toISOString(),
    channels: topics.map((topic) => {
      const stat = meta?.channels[topic.id];

      return {
        id: topic.id,
        label: topic.label,
        labelEn: topic.labelEn,
        description: topic.description,
        url: getSiteUrl(topicHref(topic.id)),
        count: stat?.count ?? 0,
        latestPublished: stat?.latestPublished ?? null,
        subcategories: topic.subcategories.map((subcategory) => {
          const subStat = meta?.subcategories[`${topic.id}/${subcategory.id}`];

          return {
            id: subcategory.id,
            label: subcategory.label,
            description: subcategory.description,
            url: getSiteUrl(subcategoryHref(topic.id, subcategory.id)),
            count: subStat?.count ?? 0,
            latestPublished: subStat?.latestPublished ?? null,
          };
        }),
      };
    }),
  };
}

export async function buildSubcategoryIndex() {
  const { channels } = buildChannelIndex();
  const subcategories: DatasetSubcategory[] = channels.flatMap((channel) =>
    channel.subcategories.map((subcategory) => ({
      ...subcategory,
      channel: channel.id,
      channelLabel: channel.label,
    })),
  );

  return { generatedAt: new Date().toISOString(), subcategories };
}

export async function buildVendorIndex() {
  const { items } = await buildArticleIndex();
  const stats = new Map<string, { count: number; latestPublished: string | null }>();
  const themeIds = new Map<string, string[]>();

  for (const theme of themes) {
    for (const companyId of getThemeCompanyIds(theme)) {
      const current = themeIds.get(companyId) ?? [];
      if (!current.includes(theme.id)) current.push(theme.id);
      themeIds.set(companyId, current);
    }
  }
  for (const article of items) {
    if (!article.company) continue;

    const current = stats.get(article.company) ?? { count: 0, latestPublished: null };
    current.count += 1;
    if (!current.latestPublished || article.publishedAt > current.latestPublished) {
      current.latestPublished = article.publishedAt;
    }
    stats.set(article.company, current);
  }

  const vendors: DatasetVendor[] = companies
    .map((company) => {
      const stat = stats.get(company.id);

      return {
        id: company.id,
        name: company.name,
        tier: company.tier,
        region: company.region,
        homepage: company.homepage,
        primaryModel: company.primaryModel,
        products: company.products.map((product) => ({ id: product.id, name: product.name })),
        url: getSiteUrl(companyHref(company.id)),
        themes: themeIds.get(company.id) ?? [],
        articleCount: stat?.count ?? 0,
        latestPublished: stat?.latestPublished ?? null,
      };
    })
    .sort(
      (left, right) =>
        right.articleCount - left.articleCount || left.name.localeCompare(right.name, "zh-Hans-CN"),
    );

  return { generatedAt: new Date().toISOString(), companies: vendors };
}

export async function buildThemeIndex() {
  const { items } = await buildArticleIndex();
  const dataset: DatasetTheme[] = themes.map((theme) => {
    const companyIds = new Set(getThemeCompanyIds(theme));
    const themeArticles = items.filter(
      (article) => article.company !== null && companyIds.has(article.company),
    );
    const latestPublished = themeArticles.reduce<string | null>(
      (latest, article) => (!latest || article.publishedAt > latest ? article.publishedAt : latest),
      null,
    );

    return {
      id: theme.id,
      name: theme.name,
      eyebrow: theme.eyebrow,
      description: theme.description,
      url: getSiteUrl(themeHref(theme.id)),
      companyCount: companyIds.size,
      articleCount: themeArticles.length,
      latestPublished,
      groups: theme.groups.map((group) => ({
        id: group.id,
        label: group.label,
        url: getSiteUrl(themeGroupHref(theme.id, group.id)),
        companyCount: group.companyIds.length,
        companyIds: group.companyIds,
      })),
    };
  });

  return { generatedAt: new Date().toISOString(), themes: dataset };
}

export async function buildTagIndex() {
  const { items } = await buildArticleIndex();
  const counts = new Map<string, number>();

  for (const article of items) {
    for (const tag of article.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  const tags: DatasetTag[] = [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag));

  return { generatedAt: new Date().toISOString(), tags };
}

export async function buildTypeIndex(): Promise<DatasetType[]> {
  const { items } = await buildArticleIndex();
  const counts = new Map<string, number>();

  for (const article of items) {
    if (!article.type) continue;
    counts.set(article.type, (counts.get(article.type) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((left, right) => right.count - left.count || left.type.localeCompare(right.type));
}
