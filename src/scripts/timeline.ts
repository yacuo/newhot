export type TimelineItem = {
  href: string;
  title: string;
  description: string;
  /** 原文日期；仅用于发展与排序兜底 */
  date: string;
  /** 站内发布日期；列表按它与它分组 */
  publishedAt: string;
  time?: string;
  author?: string;
  product?: string;
  productId?: string;
  company?: string;
  companyName?: string;
  companyLogo?: string;
  category: string;
  categoryLabel?: string;
  subcategory?: string;
  subcategoryLabel?: string;
  readingTime: number;
};

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const weekdayOf = (date: string) =>
  new Intl.DateTimeFormat("zh-CN", { weekday: "short", timeZone: "Asia/Shanghai" }).format(
    new Date(`${date}T00:00:00+08:00`),
  );

export function rowMarkup(
  item: TimelineItem,
  showTopic: boolean,
  showSubcategory: boolean,
  companyId?: string,
  productKey?: string,
) {
  const subcategory = item.subcategory ? item.subcategoryLabel ?? item.subcategory : null;
  const primaryLabel = showTopic
    ? subcategory ?? item.categoryLabel ?? item.category
    : showSubcategory
      ? subcategory
      : null;
  // 厂商 · 作者；没有作者就只显示厂商，作者已包含厂商名时不重复
  const company = item.companyName?.trim() || null;
  const author = item.author?.trim() || null;
  const normalize = (value: string) => value.toLowerCase().replace(/[\s._-]+/g, "");
  const authorLabel =
    company && author
      ? normalize(author).includes(normalize(company))
        ? author
        : `${company} · ${author}`
      : author ?? company;
  const authorBlock = authorLabel
    ? `<span class="inline-flex items-center gap-1.5 pr-1 text-slate-600">${
        item.companyLogo
          ? `<img src="${escapeHtml(item.companyLogo)}" alt="" aria-hidden="true" loading="lazy" decoding="async" class="h-4 w-4 shrink-0 rounded-full bg-white object-contain" />`
          : `<span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-medium leading-none text-slate-500">${escapeHtml(authorLabel.slice(0, 1))}</span>`
      }${escapeHtml(authorLabel)}</span>`
    : "";
  const entityLabel = item.product ?? null;

  const badges = [
    authorBlock,
    primaryLabel ? `<span class="badge badge-accent">${escapeHtml(primaryLabel)}</span>` : "",
    entityLabel ? `<span class="badge badge-muted">${escapeHtml(entityLabel)}</span>` : "",
  ].join("");

  const track = item.author
    ? `<p class="mt-[22px] truncate text-[13px] leading-6 text-slate-900" title="${escapeHtml(item.author)}">${escapeHtml(item.author)}</p>`
    : item.time
      ? `<p class="mt-[22px] font-mono text-sm leading-6 text-slate-900">${escapeHtml(item.time)}</p>`
      : "";

  const key =
    productKey ?? (companyId && item.productId ? `${item.company ?? companyId}:${item.productId}` : item.productId ?? "");

  return `<li data-article-item data-category="${escapeHtml(item.category)}" data-product="${escapeHtml(key)}" class="xl:grid xl:grid-cols-[148px_minmax(0,1fr)] xl:gap-x-8"><div class="relative hidden border-r border-slate-200 pr-5 pt-4 text-right xl:block">${track}<span class="absolute -right-[4.5px] top-[46px] h-2 w-2 rounded-full bg-slate-950 ring-2 ring-surface"></span></div><a href="${escapeHtml(item.href)}" class="group block border-t border-slate-100 py-4"><div class="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs leading-5">${badges}</div><h3 class="mt-1.5 truncate text-[15px] font-medium leading-6 text-slate-900 transition-colors group-hover:text-slate-600">${escapeHtml(item.title)}</h3><p class="mt-1 truncate text-sm leading-6 text-slate-500">${escapeHtml(item.description)}</p></a></li>`;
}

export function groupMarkup(date: string, count: number) {
  const [, month, day] = date.split("-");
  return `<div data-day-group data-day-date="${date}" class="border-t border-slate-100 first:border-t-0"><button type="button" data-day-toggle aria-expanded="true" class="group relative grid w-full grid-cols-1 items-center gap-1 py-4 text-left xl:grid-cols-[148px_minmax(0,1fr)] xl:gap-x-8"><span class="pointer-events-none absolute left-0 top-0 hidden h-full w-[148px] border-r border-slate-200 xl:block"></span><time datetime="${date}" class="text-[22px] font-semibold leading-7 tracking-tight text-slate-950">${Number(month)}月${Number(day)}日</time><span class="flex items-center gap-2 text-[11px] leading-4 text-slate-400"><span data-day-chevron class="flex h-4 w-4 shrink-0 items-center justify-center transition-transform duration-200 xl:hidden"><svg viewBox="0 0 24 24" aria-hidden="true" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span><span>${weekdayOf(date)} · ${count} 篇</span></span><span class="absolute left-[147.5px] top-1/2 hidden h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 transition-colors group-hover:border-indigo-300 group-hover:bg-indigo-100 group-hover:text-indigo-700 xl:flex"><svg data-day-chevron viewBox="0 0 24 24" aria-hidden="true" class="h-[18px] w-[18px] transition-transform duration-200" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></button><ol data-day-list class="m-0 list-none p-0"></ol></div>`;
}

export function timelineMarkup(
  items: TimelineItem[],
  showTopic: boolean,
  showSubcategory: boolean,
  companyId?: string,
  productKeys?: Map<string, string>,
) {
  if (items.length === 0) return "";

  const groups: { date: string; items: TimelineItem[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    const day = item.publishedAt;
    if (last && last.date === day) last.items.push(item);
    else groups.push({ date: day, items: [item] });
  }

  return groups
    .map(
      (group) =>
        `<div data-day-group data-day-date="${group.date}" class="border-t border-slate-100 first:border-t-0"><button type="button" data-day-toggle aria-expanded="true" class="group relative grid w-full grid-cols-1 items-center gap-1 py-4 text-left xl:grid-cols-[148px_minmax(0,1fr)] xl:gap-x-8"><span class="pointer-events-none absolute left-0 top-0 hidden h-full w-[148px] border-r border-slate-200 xl:block"></span><time datetime="${group.date}" class="text-[22px] font-semibold leading-7 tracking-tight text-slate-950">${Number(group.date.split("-")[1])}月${Number(group.date.split("-")[2])}日</time><span class="flex items-center gap-2 text-[11px] leading-4 text-slate-400"><span data-day-chevron class="flex h-4 w-4 shrink-0 items-center justify-center transition-transform duration-200 xl:hidden"><svg viewBox="0 0 24 24" aria-hidden="true" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span><span>${weekdayOf(group.date)} · ${group.items.length} 篇</span></span><span class="absolute left-[147.5px] top-1/2 hidden h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 transition-colors group-hover:border-indigo-300 group-hover:bg-indigo-100 group-hover:text-indigo-700 xl:flex"><svg data-day-chevron viewBox="0 0 24 24" aria-hidden="true" class="h-[18px] w-[18px] transition-transform duration-200" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></button><ol data-day-list class="m-0 list-none p-0">${group.items
          .map((item) => rowMarkup(item, showTopic, showSubcategory, companyId, productKeys?.get(item.href)))
          .join("")}</ol></div>`,
    )
    .join("");
}
