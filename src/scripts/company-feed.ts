import { timelineMarkup, escapeHtml, type TimelineItem } from "./timeline";

type Payload = {
  scope: string;
  total: number;
  companyId: string;
  items: TimelineItem[];
  productMap: Record<string, string>;
  productNames: Record<string, string>;
  channelMeta: Record<string, { label: string; dot: string; text: string }>;
};

type Facet = { id: string; label: string; count: number; dot?: string };

const ACTIVE = ["pill-active", "bg-indigo-600", "font-semibold", "text-white"];
const IDLE = ["text-slate-600", "hover:bg-raised", "hover:text-slate-950"];
const PRODUCT_IDLE = [
  "bg-surface",
  "text-slate-600",
  "ring-1",
  "ring-slate-900/[0.08]",
  "hover:text-indigo-700",
  "hover:ring-indigo-200",
];

const root = document.querySelector<HTMLElement>("[data-company-feed]");
const dataNode = document.querySelector<HTMLScriptElement>("[data-company-data]");

if (root && dataNode) {
  const payload = JSON.parse(dataNode.textContent ?? "{}") as Payload;
  const channels = root.querySelector<HTMLElement>("[data-company-channels]");
  const products = root.querySelector<HTMLElement>("[data-company-products]");
  const timeline = root.querySelector<HTMLElement>("[data-company-timeline]");
  const more = root.querySelector<HTMLElement>("[data-company-more]");
  const moreButton = root.querySelector<HTMLButtonElement>("[data-company-load]");

  let items = payload.items;
  let channel = "all";
  let product: string | null = null;
  let loading = false;
  let error = false;

  const pidOf = (item: TimelineItem) =>
    payload.productMap[item.href] ??
    (item.productId ? `${item.company ?? payload.companyId}:${item.productId}` : "");

  const channelFacets = (): Facet[] => {
    const counts = new Map<string, Facet>();
    for (const item of items) {
      const meta = payload.channelMeta[item.category];
      const entry = counts.get(item.category) ?? {
        id: item.category,
        label: item.categoryLabel ?? meta?.label ?? item.category,
        count: 0,
        dot: meta?.dot,
      };
      entry.count += 1;
      counts.set(item.category, entry);
    }
    return [...counts.values()].sort((a, b) => b.count - a.count);
  };

  const byChannel = () => (channel === "all" ? items : items.filter((item) => item.category === channel));

  const productFacets = (base: TimelineItem[]): Facet[] => {
    const counts = new Map<string, Facet>();
    for (const item of base) {
      const id = pidOf(item);
      if (!id) continue;
      const entry = counts.get(id) ?? { id, label: payload.productNames[id] ?? item.product ?? id, count: 0 };
      entry.count += 1;
      counts.set(id, entry);
    }
    return [...counts.values()].sort((a, b) => b.count - a.count);
  };

  // 产品选项跟随已选频道；选了频道后不存在的产品自动取消，切回来时还原
  const activeProductOf = (list: Facet[]) =>
    product && list.some((facet) => facet.id === product) ? product : null;

  const visibleOf = (active: string | null) => {
    const base = byChannel();
    return active ? base.filter((item) => pidOf(item) === active) : base;
  };

  const renderChannels = (list: Facet[]) => {
    if (!channels) return;
    channels.toggleAttribute("hidden", list.length <= 1);
    const tray = channels.querySelector("div");
    if (!tray) return;

    const buttons = [
      { id: "all", label: "全部", count: items.length, dot: null as string | null },
      ...list.map((facet) => ({ id: facet.id, label: facet.label, count: facet.count, dot: facet.dot ?? null })),
    ];

    tray.innerHTML = buttons
      .map((facet) => {
        const active = facet.id === channel;
        return `<button type="button" data-company-channel="${escapeHtml(facet.id)}" aria-pressed="${active}" class="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] transition ${active ? ACTIVE.join(" ") : IDLE.join(" ")}">${facet.dot ? `<span class="h-1.5 w-1.5 rounded-full ${active ? "bg-white/70" : facet.dot}"></span>` : ""}${escapeHtml(facet.label)}<span class="pill-count font-mono text-[11px] ${active ? "text-white/70" : "text-slate-400"}">${facet.count}</span></button>`;
      })
      .join("");
  };

  const renderProducts = (channelList: Facet[], base: TimelineItem[], list: Facet[], active: string | null) => {
    if (!products) return;
    const show = list.length > 1;
    products.toggleAttribute("hidden", !show);
    products.classList.toggle("mt-2.5", channelList.length > 1 && show);
    if (!show) return;

    const buttons = [
      { id: "all", label: "全部", count: base.length },
      ...list.map((facet) => ({ id: facet.id, label: facet.label, count: facet.count })),
    ];

    products.innerHTML = buttons
      .map((facet) => {
        const isActive = facet.id === "all" ? active === null : facet.id === active;
        return `<button type="button" data-company-product="${escapeHtml(facet.id)}" aria-pressed="${isActive}" class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] transition ${isActive ? ACTIVE.join(" ") : PRODUCT_IDLE.join(" ")}">${escapeHtml(facet.label)}<span class="pill-count font-mono text-[11px] ${isActive ? "text-white/70" : "text-slate-400"}">${facet.count}</span></button>`;
      })
      .join("");
  };

  const renderTimeline = (list: TimelineItem[]) => {
    if (!timeline) return;
    timeline.innerHTML =
      list.length === 0
        ? `<p class="py-10 text-center text-sm text-slate-500">这个组合下还没有内容。</p>`
        : `<div data-timeline>${timelineMarkup(list, true, true, payload.companyId, new Map(Object.entries(payload.productMap)))}</div>`;
  };

  const renderMore = () => {
    if (!more || !moreButton) return;
    more.toggleAttribute("hidden", items.length >= payload.total);
    moreButton.disabled = loading;
    moreButton.textContent = error
      ? "加载失败，点击重试"
      : loading
        ? "正在加载…"
        : `加载更多（已加载 ${items.length} / ${payload.total} 篇）`;
  };

  const render = () => {
    const channelList = channelFacets();
    const base = byChannel();
    const productList = productFacets(base);
    const active = activeProductOf(productList);

    renderChannels(channelList);
    renderProducts(channelList, base, productList, active);
    renderTimeline(visibleOf(active));
    renderMore();
  };

  const loadMore = async () => {
    if (loading || items.length >= payload.total) return;
    loading = true;
    error = false;
    renderMore();

    const page = Math.floor(items.length / 50) + 1;

    try {
      const build = document.querySelector('meta[name="newhot-build"]')?.getAttribute("content") ?? "";
      const suffix = build && build !== "dev" ? `?v=${encodeURIComponent(build)}` : "";
      const response = await fetch(`/data/lists/${payload.scope}/${page}.json${suffix}`, { cache: "force-cache" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = (await response.json()) as { items: TimelineItem[] };
      const fresh = page === 1 ? data.items.slice(items.length) : data.items;
      items = [...items, ...fresh];
    } catch {
      error = true;
    } finally {
      loading = false;
      render();
    }
  };

  root.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const channelButton = target.closest<HTMLElement>("[data-company-channel]");
    if (channelButton) {
      channel = channelButton.dataset.companyChannel ?? "all";
      render();
      return;
    }

    const productButton = target.closest<HTMLElement>("[data-company-product]");
    if (productButton) {
      const id = productButton.dataset.companyProduct ?? "all";
      product = id === "all" ? null : product === id ? null : id;
      render();
      return;
    }

    if (target.closest("[data-company-load]")) {
      void loadMore();
      return;
    }

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

  render();
}

export {};
