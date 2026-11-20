import { readVendorJson } from "./data";
import type { Company } from "./model";

export type CompanySeo = {
  title: string;
  description: string;
};

const table = readVendorJson<{ companies: Record<string, CompanySeo> }>("company-seo.json").companies;

/** 公司详情页 SEO：每个公司必须在 data/vendors/company-seo.json 有独立配置，缺失直接报错 */
export function getCompanySeo(company: Company): CompanySeo {
  const seo = table[company.id];

  if (!seo) {
    throw new Error(`缺少公司 SEO 配置：data/vendors/company-seo.json 未包含 ${company.id}`);
  }

  return seo;
}
