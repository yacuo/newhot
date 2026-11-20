import type { CompanyTier } from "./model";

export type CompanyAccent = {
  text: string;
  soft: string;
  dot: string;
  ring: string;
};

const tierAccents: Record<CompanyTier, CompanyAccent> = {
  model: {
    text: "text-indigo-700",
    soft: "bg-indigo-50",
    dot: "bg-indigo-500",
    ring: "ring-violet-200",
  },
  tool: {
    text: "text-sky-700",
    soft: "bg-sky-50",
    dot: "bg-sky-500",
    ring: "ring-sky-200",
  },
  infra: {
    text: "text-slate-600",
    soft: "bg-slate-100",
    dot: "bg-slate-400",
    ring: "ring-slate-200",
  },
};

export function getCompanyAccent(tier: CompanyTier): CompanyAccent {
  return tierAccents[tier] ?? tierAccents.infra;
}

/** 公司首字母块：两字中文取首字，英文取首字母 */
export function getCompanyInitials(name: string) {
  const trimmed = name.trim();
  const latin = /^[a-zA-Z]/.exec(trimmed);

  if (latin) {
    return trimmed.slice(0, 2).toUpperCase();
  }

  return trimmed.slice(0, 1);
}
