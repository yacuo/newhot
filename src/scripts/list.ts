const SHARD_SIZE = 50;
const INITIAL_SIZE = 20;
const PAGE_SIZE = 2;
const AUTO_STEPS = 2;
const MANUAL_BATCH = 20;
const STEP_DELAY = 140;

type Item = {
  href: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  author?: string;
  product?: string;
  productId?: string;
  company?: string;
  category: string;
  categoryLabel?: string;
  subcategory?: string;
  subcategoryLabel?: string;
  readingTime: number;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const buildVersion = () => document.querySelector('meta[name="newhot-build"]')?.getAttribute("content") ?? "";

const withVersion = (url: string) => {
  const build = buildVersion();
  return build && build !== "dev" ? `${url}${url.includes("?") ? "&" : "?"}v=${encodeURIComponent(build)}` : url;
};

const weekday = (date: string) =>
  new Intl.DateTimeFormat("zh-CN", { weekday: "short", timeZone: "Asia/Shanghai" }).format(
    new Date(`${date}T00:00:00+08:00`),
  );

const sameEntity = (a?: string, b?: string) => {
  if (!a || !b) return false;
  const normalize = (value: string) => value.toLowerCase().replace(/[\s._-]+/g, "");
  const left = normalize(a);
  const right = normalize(b);
  return Boolean(left && right) && (left === right || left.includes(right) || right.includes(left));
};

function rowMarkup(item: Item, showTopic: boolean, showSubcategory: boolean, companyId?: string) {
  const subcategory = item.subcategory ? item.subcategoryLabel ?? item.subcategory : null;
  const primaryLabel = showTopic
    ? subcategory ?? item.categoryLabel ?? item.category
    : showSubcategory
      ? subcategory
      : null;
  const entityLabel = item.product ?? item.author ?? null;
  const inlineAuthor = item.author && item.product && !sameEntity(item.product, item.author) ? item.author : null;

  const badges = [
    primaryLabel ? `<span class="badge badge-accent">${escapeHtml(primaryLabel)}</span>` : "",
    entityLabel ? `<span class="badge badge-muted">${escapeHtml(entityLabel)}</span>` : "",
    inlineAuthor ? `<span class="text-slate-500 xl:hidden">@${escapeHtml(inlineAuthor)}</span>` : "",
  ].join("");

  const track = item.author
    ? `<p class="mt-[22px] truncate text-[13px] leading-6 text-slate-900" title="${escapeHtml(item.author)}">${escapeHtml(item.author)}</p>`
    : item.time
      ? `<p class="mt-[22px] font-mono text-sm leading-6 text-slate-900">${escapeHtml(item.time)}</p>`
      : "";

  const productKey = companyId && item.productId ? `${item.company ?? companyId}:${item.productId}` : item.productId ?? "";

  return `<li data-article-item data-category="${escapeHtml(item.category)}" data-product="${escapeHtml(productKey)}" class="xl:grid xl:grid-cols-[148px_minmax(0,1fr)] xl:gap-x-8"><div class="relative hidden border-r border-slate-200 pr-5 pt-4 text-right xl:block">${track}<span class="absolute -right-[4.5px] top-[46px] h-2 w-2 rounded-full bg-slate-950 ring-2 ring-surface"></span></div><a href="${escapeHtml(item.href)}" class="group block border-t border-slate-100 py-4"><div class="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs leading-5">${badges}</div><h3 class="mt-1.5 truncate text-[15px] font-medium leading-6 text-slate-900 transition-colors group-hover:text-slate-600">${escapeHtml(item.title)}</h3><p class="mt-1 truncate text-sm leading-6 text-slate-500">${escapeHtml(item.description)}</p></a></li>`;
}

function groupMarkup(date: string, count: number) {
  const [, month, day] = date.split("-");
  return `<div data-day-group data-day-date="${date}" class="border-t border-slate-100 first:border-t-0"><button type="button" data-day-toggle aria-expanded="true" class="group relative grid w-full grid-cols-1 items-center gap-1 py-4 text-left xl:grid-cols-[148px_minmax(0,1fr)] xl:gap-x-8"><span class="pointer-events-none absolute left-0 top-0 hidden h-full w-[148px] border-r border-slate-200 xl:block"></span><time datetime="${date}" class="text-[22px] font-semibold leading-7 tracking-tight text-slate-950">${Number(month)}月${Number(day)}日</time><span class="flex items-center gap-2 text-[11px] leading-4 text-slate-400"><span data-day-chevron class="flex h-4 w-4 shrink-0 items-center justify-center transition-transform duration-200 xl:hidden"><svg viewBox="0 0 24 24" aria-hidden="true" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span><span>${weekday(date)} · ${count} 篇</span></span><span class="absolute left-[147.5px] top-1/2 hidden h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 transition-colors group-hover:border-indigo-300 group-hover:bg-indigo-100 group-hover:text-indigo-700 xl:flex"><svg data-day-chevron viewBox="0 0 24 24" aria-hidden="true" class="h-[18px] w-[18px] transition-transform duration-200" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></button><ol data-day-list class="m-0 list-none p-0"></ol></div>`;
}

class LazyList {
  private root: HTMLElement;
  private scope: string;
  private total: number;
  private showTopic: boolean;
  private showSubcategory: boolean;
  private companyId?: string;
  private queue: Item[] = [];
  private rendered = 0;
  private visible = 0;
  private autoSteps = 0;
  private manualQuota = 0;
  private loading = false;
  private error = false;
  private exhausted = false;
  private nearBottom = false;
  private inFlight = false;
  private observer: IntersectionObserver | null = null;
  private timer = 0;

  constructor(root: HTMLElement) {
    this.root = root;
    this.scope = root.dataset.scope ?? "";
    this.total = Number(root.dataset.total ?? "0");
    this.showTopic = root.dataset.showTopic !== "0";
    this.showSubcategory = root.dataset.showSubcategory !== "0";
    this.companyId = root.dataset.companyId || undefined;
    this.visible = root.querySelectorAll("[data-article-item]").length;
    this.rendered = this.visible;
    this.exhausted = this.visible >= this.total;
    this.observe();
    this.renderStatus();
  }

  private get hasMore() {
    return !this.exhausted && this.visible < this.total;
  }

  private status() {
    return this.root.querySelector<HTMLElement>("[data-list-status]");
  }

  private observe() {
    const node = this.status();
    if (!node || !this.hasMore) return;

    this.observer?.disconnect();
    this.observer = new IntersectionObserver(
      (entries) => {
        this.nearBottom = entries.some((entry) => entry.isIntersecting);
        this.tick();
      },
      { rootMargin: "600px 0px" },
    );
    this.observer.observe(node);
  }

  private renderStatus() {
    const node = this.status();
    if (!node) return;

    if (!this.hasMore) {
      node.outerHTML = `<p class="border-t border-slate-100 py-4 text-center text-xs text-slate-400">已加载全部 ${this.total} 篇</p>`;
      this.observer?.disconnect();
      return;
    }

    const showManual = this.manualQuota === 0 && this.autoSteps >= AUTO_STEPS;

    node.innerHTML = this.error
      ? `<button type="button" data-list-retry class="rounded-md border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700">加载失败，点击重试</button>`
      : showManual
        ? `<button type="button" data-list-manual class="rounded-md border border-indigo-200 px-4 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700">加载更多</button>`
        : this.manualQuota > 0 || this.loading || (this.nearBottom && this.visible < this.rendered + this.queue.length)
          ? "正在加载…"
          : "继续向下滚动加载更多";
  }

  private async loadShard() {
    if (this.inFlight) return;
    this.inFlight = true;
    this.loading = true;
    this.error = false;
    this.renderStatus();

    const page = Math.floor(this.rendered / SHARD_SIZE) + 1;

    try {
      const response = await fetch(withVersion(`/data/lists/${this.scope}/${page}.json`), { cache: "force-cache" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = (await response.json()) as { items: Item[] };
      const fresh = page === 1 ? data.items.slice(this.rendered) : data.items;
      const wasEmpty = this.visible === 0;

      if (fresh.length === 0) {
        this.exhausted = true;
      } else {
        this.queue.push(...fresh);
        this.rendered += fresh.length;
        if (wasEmpty) {
          const target = Math.min(INITIAL_SIZE, fresh.length, this.total);
          while (this.visible < target) this.flush();
        } else {
          this.flush();
        }
      }
    } catch {
      this.error = true;
    } finally {
      this.inFlight = false;
      this.loading = false;
      this.renderStatus();
      this.tick();
    }
  }

  private flush() {
    const timeline = this.root.querySelector<HTMLElement>("[data-timeline]") ?? this.createTimeline();
    if (!timeline) return;

    timeline.querySelector("[data-empty-state]")?.remove();

    let added = 0;
    while (this.queue.length && this.visible < this.total) {
      const item = this.queue[0];
      const lastGroup = timeline.querySelector<HTMLElement>("[data-day-group]:last-of-type");

      if (lastGroup && lastGroup.dataset.dayDate === item.date) {
        const list = lastGroup.querySelector("[data-day-list]");
        list?.insertAdjacentHTML("beforeend", rowMarkup(item, this.showTopic, this.showSubcategory, this.companyId));
        this.updateGroupCount(lastGroup, item.date);
      } else {
        if (lastGroup) this.updateGroupCount(lastGroup, lastGroup.dataset.dayDate ?? item.date);
        timeline.insertAdjacentHTML("beforeend", groupMarkup(item.date, 1));
        timeline
          .querySelector<HTMLElement>("[data-day-group]:last-of-type [data-day-list]")
          ?.insertAdjacentHTML("beforeend", rowMarkup(item, this.showTopic, this.showSubcategory, this.companyId));
      }

      this.queue.shift();
      this.visible += 1;
      added += 1;
      if (added >= PAGE_SIZE) break;
    }

    if (added > 0) this.root.dispatchEvent(new CustomEvent("list:appended", { bubbles: true }));
  }

  private updateGroupCount(group: HTMLElement, date: string) {
    const count = group.querySelectorAll("[data-day-list] > li").length;
    const label = group.querySelector("time + span span");
    if (label) label.textContent = `${weekday(date)} · ${count} 篇`;
  }

  private createTimeline() {
    const node = document.createElement("div");
    node.setAttribute("data-timeline", "");
    this.root.insertBefore(node, this.status());
    return node;
  }

  private step() {
    const step = Math.min(PAGE_SIZE, this.total - this.visible);
    if (step <= 0) {
      this.exhausted = true;
      this.renderStatus();
      return;
    }

    this.flush();

    if (this.manualQuota > 0) this.manualQuota = Math.max(0, this.manualQuota - step);
    else this.autoSteps += 1;

    this.renderStatus();
    if (this.hasMore && this.nearBottom) this.tick();
  }

  tick() {
    if (!this.hasMore || this.error || this.loading) return;

    if (this.visible >= this.rendered) {
      void this.loadShard();
      return;
    }

    if (this.manualQuota === 0 && this.autoSteps >= AUTO_STEPS) return;

    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.step(), STEP_DELAY);
  }

  manual() {
    this.manualQuota = MANUAL_BATCH;
    this.autoSteps = 0;
    this.nearBottom = true;
    this.renderStatus();
    this.tick();
  }

  retry() {
    void this.loadShard();
  }
}

const instances = new WeakMap<HTMLElement, LazyList>();

for (const root of Array.from(document.querySelectorAll<HTMLElement>("[data-article-list]"))) {
  instances.set(root, new LazyList(root));
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const container = target.closest<HTMLElement>("[data-article-list]");
  if (!container) return;
  const instance = instances.get(container);
  if (!instance) return;

  if (target.closest("[data-list-manual]")) instance.manual();
  if (target.closest("[data-list-retry]")) instance.retry();

  const toggle = target.closest<HTMLButtonElement>("[data-day-toggle]");
  if (toggle) {
    const group = toggle.closest("[data-day-group]");
    const list = group?.querySelector("[data-day-list]");
    if (!list) return;
    const collapsed = !list.hasAttribute("hidden");
    list.toggleAttribute("hidden", collapsed);
    toggle.setAttribute("aria-expanded", String(!collapsed));
    for (const chevron of Array.from(toggle.querySelectorAll("[data-day-chevron]"))) {
      chevron.classList.toggle("-rotate-90", collapsed);
    }
  }
});

export {};
