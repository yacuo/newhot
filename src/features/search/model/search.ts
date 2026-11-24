import { searchConfig, type SearchPromotion } from "@/shared/config/search.config";

type SearchItem = {
  href: string;
  title: string;
  description: string;
  date: string;
  category: string;
  categoryLabel?: string;
  subcategoryLabel?: string;
  tags?: string[];
  product?: string;
  author?: string;
};

type SearchResult = SearchItem & { score: number; matchLabel: string; snippet: string };
type DisplayResult =
  | (SearchResult & { resultType: "natural" })
  | (SearchPromotion & { resultType: "promotion" });

type SearchStatus = "idle" | "ready" | "tooShort" | "tooBroad" | "empty";
type Mode = "desktop" | "mobile";

/** 命中足够多就停，避免为了搜索继续拉取更老的分片 */
const ENOUGH_RESULTS = 6;
/** 自动补搜的上限；超过后由用户点击「继续搜索更早的文章」 */
const MAX_AUTO_PAGES = 4;

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const normalizeKeyword = (value: string) => value.trim().toLowerCase();

const isMeaningfulKeyword = (keyword: string) => {
  if (!/[a-zA-Z0-9\u4e00-\u9fa5]/.test(keyword)) return false;
  return keyword.replace(/\s+/g, "").length >= 2;
};

const buildVersion = () => document.querySelector('meta[name="newhot-build"]')?.getAttribute("content") ?? "";

const withVersion = (url: string) => {
  const build = buildVersion();
  return build && build !== "dev" ? `${url}${url.includes("?") ? "&" : "?"}v=${encodeURIComponent(build)}` : url;
};

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(withVersion(url), { cache: "force-cache" });
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

function scoreItem(item: SearchItem, keyword: string) {
  const title = item.title.toLowerCase();
  const description = item.description.toLowerCase();
  const category = `${item.categoryLabel ?? ""} ${item.category}`.toLowerCase();
  const tags = [...(item.tags ?? []), item.product ?? "", item.author ?? ""].join(" ").toLowerCase();
  let score = 0;

  if (title.includes(keyword)) score += 80;
  if (description.includes(keyword)) score += 35;
  if (category.includes(keyword)) score += 20;
  if (tags.includes(keyword)) score += 20;

  for (const word of keyword.split(/\s+/).filter(Boolean)) {
    if (word !== keyword) {
      if (title.includes(word)) score += 24;
      if (description.includes(word)) score += 10;
      if (tags.includes(word)) score += 4;
    }
  }

  return score;
}

const keywordParts = (keyword: string) => keyword.split(/\s+/).filter(Boolean);

function findMatchedKeyword(text: string, keyword: string) {
  const normalized = text.toLowerCase();
  if (normalized.includes(keyword)) return keyword;
  return keywordParts(keyword).find((part) => normalized.includes(part)) || "";
}

function createSnippet(text: string, keyword: string, size = 96) {
  const matched = findMatchedKeyword(text, keyword);
  const index = matched ? text.toLowerCase().indexOf(matched) : -1;

  if (index < 0) return text.slice(0, size).trim();

  const start = Math.max(0, index - 32);
  const end = Math.min(text.length, index + matched.length + size);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";

  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

function getMatchMeta(item: SearchItem, keyword: string) {
  const fields = [
    { label: "标题", text: item.title },
    { label: "描述", text: item.description },
    { label: "标签", text: [...(item.tags ?? []), item.product ?? ""].filter(Boolean).join(" ") },
    { label: "栏目", text: `${item.categoryLabel ?? ""} ${item.subcategoryLabel ?? ""}`.trim() },
  ];

  const matched = fields.find((field) => findMatchedKeyword(field.text, keyword)) ?? fields[0];

  return { matchLabel: matched.label, snippet: createSnippet(matched.text, keyword) };
}

/** 高亮命中片段：先按关键词切段再转义，避免把 HTML 写进结果 */
function highlight(text: string, keyword: string) {
  const matched = findMatchedKeyword(text, keyword);
  if (!matched) return escapeHtml(text);

  const lower = text.toLowerCase();
  const needle = matched.toLowerCase();
  let output = "";
  let cursor = 0;

  while (true) {
    const index = lower.indexOf(needle, cursor);
    if (index < 0) {
      output += escapeHtml(text.slice(cursor));
      break;
    }

    output += escapeHtml(text.slice(cursor, index));
    output += `<mark class="site-search-mark rounded bg-yellow-200 px-0.5 text-slate-950">${escapeHtml(text.slice(index, index + needle.length))}</mark>`;
    cursor = index + needle.length;
  }

  return output;
}

function matchedPromotions(keyword: string): (SearchPromotion & { resultType: "promotion" })[] {
  return (searchConfig.promotions as readonly SearchPromotion[])
    .filter((item) => item.enabled !== false)
    .filter(
      (item) =>
        item.alwaysShow ||
        Boolean(
          item.keywords?.some(
            (word) => keyword.includes(word.toLowerCase()) || word.toLowerCase().includes(keyword),
          ),
        ),
    )
    .map((item) => ({ ...item, resultType: "promotion" as const }));
}

const EMPTY_COPY: Record<Exclude<SearchStatus, "ready" | "idle">, { title: string; description: string }> = {
  tooShort: { title: "关键词太短", description: "请输入至少 2 个有效字符，标点符号不会触发搜索。" },
  tooBroad: { title: "关键词太泛", description: "命中内容太多，请再多输入一个字或换一个更具体的词。" },
  empty: { title: "没有找到自然搜索结果", description: "换个关键词试试，或者减少特殊符号后重新搜索。" },
};

function emptyMarkup(status: SearchStatus, mode: Mode) {
  const copy = EMPTY_COPY[(status === "ready" || status === "idle" ? "empty" : status) as keyof typeof EMPTY_COPY];
  const compact = mode === "mobile";

  return `<div class="site-search-empty ${compact ? "mx-4 my-2 rounded-xl px-4 py-5" : "mx-5 my-3 rounded-xl px-6 py-7"} border border-dashed border-slate-200 bg-slate-50 text-center text-slate-500">
    <svg viewBox="0 0 64 64" aria-hidden="true" class="${compact ? "mx-auto h-12 w-12" : "mx-auto h-16 w-16"} text-slate-300" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="28" cy="28" r="15"/><path d="m39 39 11 11"/><path d="M21 28h14"/></svg>
    <div class="${compact ? "mt-3 text-sm" : "mt-4 text-base"} font-semibold text-slate-700">${copy.title}</div>
    <p class="${compact ? "mt-1.5 text-xs leading-5" : "mt-2 text-sm leading-6"}">${copy.description}</p>
  </div>`;
}

class SearchWidget {
  readonly mode: Mode;
  private input: HTMLInputElement;
  private results: HTMLElement;

  private items: SearchItem[] = [];
  private pagesLoaded = 0;
  private loading = false;
  private loadError = false;
  private exhausted = false;
  private channels: string[] | null = null;

  private query = "";
  private debounced = "";
  private activeIndex = 0;
  private timer = 0;

  constructor(root: HTMLElement, mode: Mode) {
    this.mode = mode;
    this.input = root.querySelector<HTMLInputElement>("[data-search-input]")!;
    this.results = root.querySelector<HTMLElement>("[data-search-results]")!;

    this.input.addEventListener("input", () => this.onInput());
    this.input.addEventListener("keydown", (event) => this.onKeyDown(event));
    this.results.addEventListener("mouseover", (event) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>("[data-search-index]");
      if (!target) return;
      const index = Number(target.dataset.searchIndex);
      if (Number.isNaN(index) || index === this.activeIndex) return;
      this.activeIndex = index;
      this.render();
    });
    this.results.addEventListener("click", (event) => {
      const target = (event.target as Element | null)?.closest<HTMLAnchorElement>("[data-search-result]");
      if (target) this.close();
    });
  }

  get visible() {
    return this.mode === "mobile"
      ? !this.input.closest<HTMLElement>("[data-mobile-search-panel]")!.hasAttribute("hidden")
      : (this.input.closest("dialog")?.hasAttribute("open") ?? false);
  }

  open() {
    if (this.mode === "mobile") this.input.closest<HTMLElement>("[data-mobile-search-panel]")?.removeAttribute("hidden");
    else (this.input.closest("dialog") as HTMLDialogElement | null)?.showModal();

    requestAnimationFrame(() => this.input.focus());
    this.render();
    if (isMeaningfulKeyword(this.debounced)) this.ensureFirstPage();
  }

  close() {
    if (this.mode === "mobile") this.input.closest<HTMLElement>("[data-mobile-search-panel]")?.setAttribute("hidden", "");
    else {
      const dialog = this.input.closest("dialog") as HTMLDialogElement | null;
      if (dialog?.open) dialog.close();
    }
    this.input.blur();
  }

  private onInput() {
    this.query = this.input.value;
    this.activeIndex = 0;
    this.render();
    window.clearTimeout(this.timer);

    if (!normalizeKeyword(this.query)) return;

    this.timer = window.setTimeout(() => {
      this.debounced = normalizeKeyword(this.query);
      this.activeIndex = 0;
      this.render();
      this.ensureFirstPage();
    }, 160);
  }

  private onKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      this.close();
      return;
    }

    const display = this.displayResults();
    if (!display.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.activeIndex = (this.activeIndex + 1) % display.length;
      this.render();
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      this.activeIndex = (this.activeIndex - 1 + display.length) % display.length;
      this.render();
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const target = display[this.activeIndex];
      if (target) window.location.href = target.href;
    }
  }

  private searchState() {
    if (!this.debounced) return { results: [] as SearchResult[], status: "idle" as SearchStatus };

    if (!isMeaningfulKeyword(this.debounced)) {
      return { results: [] as SearchResult[], status: "tooShort" as SearchStatus };
    }

    const matched: SearchResult[] = [];

    for (const item of this.items) {
      const score = scoreItem(item, this.debounced);
      if (score <= 0) continue;
      matched.push({ ...item, score, ...getMatchMeta(item, this.debounced) });
    }

    if (matched.length === 0) return { results: [] as SearchResult[], status: "empty" as SearchStatus };

    if (this.debounced.length < 3 && matched.length > 20) {
      return { results: [] as SearchResult[], status: "tooBroad" as SearchStatus };
    }

    matched.sort((a, b) => b.score - a.score || b.date.localeCompare(a.date));

    return { results: matched.slice(0, ENOUGH_RESULTS), status: "ready" as SearchStatus };
  }

  private matchedCount() {
    if (!isMeaningfulKeyword(this.debounced)) return 0;
    return this.items.filter((item) => scoreItem(item, this.debounced) > 0).length;
  }

  private displayResults(): DisplayResult[] {
    if (!this.debounced || !isMeaningfulKeyword(this.debounced)) return [];

    const natural = this.searchState().results.map((item) => ({ ...item, resultType: "natural" as const }));
    return [...matchedPromotions(this.debounced), ...natural].slice(0, 7);
  }

  private ensureFirstPage() {
    if (this.pagesLoaded > 0 || this.exhausted || this.loading) return;
    if (!isMeaningfulKeyword(this.debounced)) return;
    void this.loadPage(1);
  }

  private maybeLoadMore() {
    if (!this.visible || this.loading || this.exhausted || this.loadError) return;
    if (!isMeaningfulKeyword(this.debounced)) return;
    if (this.matchedCount() >= ENOUGH_RESULTS) return;
    if (this.pagesLoaded === 0 || this.pagesLoaded >= MAX_AUTO_PAGES) return;
    void this.loadPage(this.pagesLoaded + 1);
  }

  private async loadPage(page: number) {
    if (this.loading) return;

    this.loading = true;
    this.loadError = false;
    this.render();

    try {
      if (!this.channels) {
        const manifest = await fetchJson<{ channels: string[] }>("/data/lists/index.json");
        this.channels = manifest?.channels ?? [];
      }

      // 只拉当前这一页：各频道并行，先拿到结果就先展示
      const shards = await Promise.all(
        this.channels.map((channel) => fetchJson<{ items: SearchItem[] }>(`/data/lists/${channel}/${page}.json`)),
      );
      const seen = new Set(this.items.map((item) => item.href));
      const fresh = shards.flatMap((shard) => shard?.items ?? []).filter((item) => !seen.has(item.href));

      if (fresh.length === 0) {
        this.exhausted = true;
      } else {
        this.items.push(...fresh);
        this.pagesLoaded = page;
      }
    } catch {
      this.loadError = true;
    } finally {
      this.loading = false;
      this.render();
      this.maybeLoadMore();
    }
  }

  private itemMarkup(item: DisplayResult, index: number) {
    const compact = this.mode === "mobile";
    const active = index === this.activeIndex;
    const isPromo = item.resultType === "promotion";

    const blockClass = compact
      ? `site-search-result block px-4 py-3 ${active ? "bg-slate-100" : "hover:bg-slate-50"}`
      : `site-search-result block px-5 py-4 ${active ? "bg-slate-100" : "hover:bg-slate-50"}`;
    const titleClass = compact
      ? "block pr-20 text-sm font-semibold leading-5"
      : "block pr-24 text-base font-semibold leading-6";
    const snippetClass = compact
      ? "mt-1.5 block max-h-10 overflow-hidden text-xs leading-5 text-slate-500"
      : "mt-2 block max-h-12 overflow-hidden text-sm leading-6 text-slate-500";
    const badgeClass = compact
      ? "site-search-category-badge mt-0.5 shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-700"
      : "site-search-category-badge mt-1 shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700";
    const matchClass = compact
      ? "site-search-match-badge mr-1.5 inline-flex rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-700"
      : "site-search-match-badge mr-2 inline-flex rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700";
    const promoClass = compact
      ? "site-search-promo-badge mt-0.5 shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] text-orange-700"
      : "site-search-promo-badge mt-1 shrink-0 rounded-full bg-orange-100 px-2.5 py-1 text-xs text-orange-700";

    const snippet = isPromo ? item.description : item.snippet;
    const badge = isPromo ? "推荐" : item.categoryLabel ?? item.category;
    const external = isPromo && item.external;

    return `<a href="${escapeHtml(item.href)}" data-search-result data-search-index="${index}"${
      external ? ' target="_blank" rel="noreferrer"' : ""
    } class="${blockClass}">
      <div class="relative block">
        <span class="min-w-0">
          <span class="${titleClass}">${highlight(item.title, this.debounced)}</span>
          <span class="${snippetClass}">${isPromo ? "" : `<span class="${matchClass}">命中${item.matchLabel}</span>`}${highlight(snippet, this.debounced)}</span>
        </span>
        <span class="${isPromo ? promoClass : badgeClass} absolute right-0 top-0">${escapeHtml(badge)}</span>
      </div>
    </a>`;
  }

  private render() {
    const query = normalizeKeyword(this.query);
    if (!query) {
      this.results.innerHTML = "";
      return;
    }

    const menuClass =
      this.mode === "mobile"
        ? "site-search-menu mt-3 max-h-[calc(100vh-180px)] overflow-y-auto rounded-xl bg-surface py-1 text-slate-900 shadow-[0_18px_50px_rgba(15,23,42,0.25)] ring-1 ring-slate-200"
        : "site-search-menu mt-4 max-h-[min(62vh,560px)] overflow-y-auto rounded-xl bg-surface py-2 text-slate-900 shadow-[0_18px_50px_rgba(15,23,42,0.14)] ring-1 ring-slate-200";

    const state = this.searchState();
    const display = this.displayResults();
    const compact = this.mode === "mobile";
    const padding = compact ? "mx-4" : "mx-5";

    let inner = "";

    if (display.length > 0) {
      inner += display.map((item, index) => this.itemMarkup(item, index)).join("");

      if (state.results.length === 0) {
        inner += this.loading
          ? `<p class="${padding} py-6 text-center text-sm text-slate-500">正在搜索…</p>`
          : emptyMarkup(state.status, this.mode);
      }

      if (this.loadError) {
        inner += `<button type="button" data-search-retry class="${padding} my-3 block rounded-lg border border-dashed border-slate-200 py-2 text-center text-xs text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700">搜索请求失败，点击重试</button>`;
      } else if (!this.exhausted && state.results.length > 0) {
        inner += `<button type="button" data-search-more ${this.loading ? "disabled" : ""} class="${padding} my-3 block rounded-lg border border-dashed border-slate-200 py-2 text-center text-xs text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700 disabled:opacity-60">${this.loading ? "正在搜索更早的文章…" : "继续搜索更早的文章"}</button>`;
      }
    } else {
      inner += emptyMarkup(state.status, this.mode);
    }

    this.results.innerHTML = `<div class="${menuClass}">${inner}</div>`;

    this.results.querySelector("[data-search-more]")?.addEventListener("click", () => {
      if (this.loading || this.exhausted) return;
      void this.loadPage(this.pagesLoaded + 1);
    });

    this.results.querySelector("[data-search-retry]")?.addEventListener("click", () => {
      void this.loadPage(Math.max(1, this.pagesLoaded + 1));
    });
  }
}

let initialized = false;
let desktopWidget: SearchWidget | null = null;
let mobileWidget: SearchWidget | null = null;

function syncMobileToggle() {
  const panel = document.querySelector<HTMLElement>("[data-mobile-search-panel]");
  const button = document.querySelector<HTMLElement>("[data-mobile-search-toggle]");
  if (panel && button) button.setAttribute("aria-expanded", String(!panel.hasAttribute("hidden")));
}

function init() {
  if (initialized) return;
  initialized = true;

  const dialog = document.querySelector<HTMLDialogElement>("[data-search-dialog]");
  if (dialog) {
    desktopWidget = new SearchWidget(dialog, "desktop");
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.querySelector("[data-search-close]")?.addEventListener("click", () => dialog.close());
  }

  const panel = document.querySelector<HTMLElement>("[data-mobile-search-panel]");
  if (panel) {
    mobileWidget = new SearchWidget(panel, "mobile");
    panel.querySelector("[data-mobile-search-close]")?.addEventListener("click", () => {
      panel.setAttribute("hidden", "");
      syncMobileToggle();
    });
  }
}

/** 搜索脚本按需加载：点开搜索时才拉取，首屏不多付这几 KB */
export function openDesktop() {
  init();
  desktopWidget?.open();
}

export function toggleMobile() {
  init();
  const panel = document.querySelector<HTMLElement>("[data-mobile-search-panel]");
  if (!panel || !mobileWidget) return;

  if (panel.hasAttribute("hidden")) mobileWidget.open();
  else mobileWidget.close();

  syncMobileToggle();
}

export {};
