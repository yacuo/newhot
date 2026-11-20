import { readVendorJson } from "./data";

export type CompanyTier = "model" | "tool" | "infra";
export type CompanyRegion = "cn" | "global";

export type CompanyProduct = {
  id: string;
  name: string;
  aliases: string[];
};

export type Company = {
  id: string;
  name: string;
  tier: CompanyTier;
  region: CompanyRegion;
  homepage: string;
  /** 列表与详情展示用的主力模型，用来拼「公司 / 模型」 */
  primaryModel: string | null;
  /** public/logos 下的本地图标；没有则回退首字母块 */
  logo?: string;
  aliases: string[];
  /** 来源注册表里的 vendorId，用来把文章归到公司 */
  vendorIds: string[];
  products: CompanyProduct[];
  /** 母公司 id：TRAE 这类大厂子品牌用它挂回字节跳动 */
  parentId?: string | null;
};

const companyList = readVendorJson<{ companies: Company[] }>("companies.json").companies;

export const companies: Company[] = [...companyList].sort((a, b) => {
  const weight: Record<CompanyTier, number> = { model: 0, tool: 1, infra: 2 };

  return weight[a.tier] - weight[b.tier] || a.name.localeCompare(b.name, "zh-Hans-CN");
});

export const modelCompanies = companies.filter((company) => company.tier === "model");

const byId = new Map(companies.map((company) => [company.id, company]));

const byVendorId = new Map<string, Company>();
const byAlias = new Map<string, Company>();
const byParentId = new Map<string, Company[]>();

for (const company of companies) {
  for (const vendorId of company.vendorIds) {
    byVendorId.set(vendorId.toLowerCase(), company);
  }

  for (const alias of [company.name, ...company.aliases]) {
    byAlias.set(alias.trim().toLowerCase(), company);
  }

  if (company.parentId) {
    const siblings = byParentId.get(company.parentId) ?? [];
    siblings.push(company);
    byParentId.set(company.parentId, siblings);
  }
}

/** 母公司页面上展示并跳转的子公司/子品牌（如字节跳动 → TRAE） */
export function getChildCompanies(companyId?: string | null) {
  return companyId ? byParentId.get(companyId) ?? [] : [];
}

/** 子公司页面回链母公司 */
export function getParentCompany(company: Company) {
  return company.parentId ? byId.get(company.parentId) ?? null : null;
}

export function getCompany(id?: string | null) {
  return id ? byId.get(id) ?? null : null;
}

export function companyHref(id: string) {
  return `/${id}/`;
}

/** `openai:gpt-6.1` → openai；`deepseek-api:xxx` 也按前缀直配 */
export function resolveCompanyBySourceId(sourceId?: string | null) {
  if (!sourceId) return null;

  const prefix = sourceId.split(":")[0]?.trim().toLowerCase();

  return prefix ? byVendorId.get(prefix) ?? null : null;
}

export function resolveCompanyByAuthor(author?: string | null) {
  if (!author) return null;

  return byAlias.get(author.trim().toLowerCase()) ?? null;
}

/** 内容导入的唯一入口：先按 sourceId，再退回 author */
export function resolveCompany(sourceId?: string | null, author?: string | null) {
  return resolveCompanyBySourceId(sourceId) ?? resolveCompanyByAuthor(author);
}

export const companyTierLabels: Record<CompanyTier, string> = {
  model: "大模型公司",
  tool: "工具与应用",
  infra: "开源与运行时",
};

export const companyRegionLabels: Record<CompanyRegion, string> = {
  cn: "中国",
  global: "海外",
};

/** 主力模型名；和公司名重复时不重复展示（如 DeepSeek / DeepSeek） */
export function getCompanyModel(company: Company) {
  const model = company.primaryModel?.trim();

  if (!model) return null;

  return model.toLowerCase() === company.name.trim().toLowerCase() ? null : model;
}

/** 文章命中的产品：先查标签，再查标题，长别名优先 */
export function resolveProduct(company: Company, tags: string[], title: string) {
  const candidates = company.products.flatMap((product) =>
    product.aliases
      .filter((alias) => alias.trim().length > 1)
      .map((alias) => ({ product, alias, lower: alias.trim().toLowerCase() })),
  );

  candidates.sort((a, b) => b.alias.length - a.alias.length);

  const lowerTags = tags.map((tag) => tag.trim().toLowerCase());
  const lowerTitle = title.toLowerCase();

  const fromTags = candidates.find((candidate) => lowerTags.includes(candidate.lower));

  if (fromTags) return fromTags.product;

  return candidates.find((candidate) => lowerTitle.includes(candidate.lower))?.product ?? null;
}

/**
 * 模型发布时间轴上的模型名。
 *
 * 导入文章的 tags 形如 [公司名, 模型名, …]，先排除公司别名，取第一个像模型的标签；
 * 没有可用标签时退回产品名，避免把「版本更新」这类标签当成模型。
 */
export function resolveModelName(company: Company, tags: string[], title: string, type: string) {
  const companyWords = new Set([company.name, ...company.aliases].map((word) => word.trim().toLowerCase()));
  const noise = ["版本更新", "模型发布", "发布", "更新", "开源", "preview", "public preview"];

  const candidates = tags.filter((tag) => {
    const lower = tag.trim().toLowerCase();

    return lower.length > 1 && !companyWords.has(lower) && !noise.includes(lower);
  });

  // 优先带版本号的标签（GPT-6 Cyber / Claude 5.2），否则取第一个模型标签（Sora / 搜索 API）
  const name = candidates.find((tag) => /[\d.]/.test(tag)) ?? candidates[0];

  if (name) return name.trim();

  const product = resolveProduct(company, tags, title);

  if (product) return product.name;

  return type === "release" ? title.split(/[：:]/)[0].trim() : "模型动态";
}
