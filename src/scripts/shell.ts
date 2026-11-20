const STORAGE_THEME = "newhot-theme";
const STORAGE_ACCENT = "newhot-accent";
const STORAGE_SIDEBAR = "newhot:sidebar-collapsed";
const DEFAULT_ACCENT_ID = "electric";

const root = document.documentElement;

function readAccents(): { value: string; label: string; color: string }[] {
  const list = getComputedStyle(root)
    .getPropertyValue("--accent-list")
    .trim()
    .replace(/^["']/, "")
    .replace(/["']$/, "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (!list.length) return [{ value: "", label: "电蓝", color: "#2b4eff" }];

  const previous = root.getAttribute("data-accent");
  const items = list.map((id) => {
    const value = id === DEFAULT_ACCENT_ID ? "" : id;

    if (value) root.setAttribute("data-accent", value);
    else root.removeAttribute("data-accent");

    const style = getComputedStyle(root);
    return {
      value,
      label: style.getPropertyValue("--accent-label").trim().replace(/^["']/, "").replace(/["']$/, "") || value || "默认",
      color: style.getPropertyValue("--accent-swatch").trim() || "#2b4eff",
    };
  });

  if (previous) root.setAttribute("data-accent", previous);
  else root.removeAttribute("data-accent");

  return items;
}

/** 侧边栏会在桌面栏和抽屉里各渲染一份，所有外观控件都要同步全部实例 */
function syncThemeButton() {
  const dark = root.getAttribute("data-theme") === "dark";
  const label = dark ? "切换到日间模式" : "切换到夜间模式";

  for (const button of Array.from(document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]"))) {
    button.setAttribute("aria-pressed", String(dark));
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);

    const text = button.querySelector<HTMLElement>("[data-theme-label]");
    if (text) text.textContent = dark ? "夜间" : "日间";

    button.querySelector<HTMLElement>('[data-theme-icon="light"]')?.toggleAttribute("hidden", dark);
    button.querySelector<HTMLElement>('[data-theme-icon="dark"]')?.toggleAttribute("hidden", !dark);
  }
}

function applyTheme(dark: boolean) {
  if (dark) root.setAttribute("data-theme", "dark");
  else root.removeAttribute("data-theme");

  try {
    localStorage.setItem(STORAGE_THEME, dark ? "dark" : "light");
  } catch {
    /* 忽略 */
  }

  syncThemeButton();
}

function syncSidebarButton() {
  const collapsed = root.hasAttribute("data-sidebar-collapsed");
  const button = document.querySelector<HTMLButtonElement>("[data-sidebar-toggle]");
  if (!button) return;

  const label = collapsed ? "展开侧边栏" : "收起侧边栏";
  button.setAttribute("aria-pressed", String(collapsed));
  button.setAttribute("aria-label", label);
  button.setAttribute("title", label);
}

function applySidebar(collapsed: boolean) {
  root.toggleAttribute("data-sidebar-collapsed", collapsed);

  try {
    localStorage.setItem(STORAGE_SIDEBAR, collapsed ? "1" : "0");
  } catch {
    /* 忽略 */
  }

  syncSidebarButton();
}

type AccentItem = { value: string; label: string; color: string };
type AccentPicker = { root: HTMLElement; toggle: HTMLButtonElement; menu: HTMLElement; dot: HTMLElement };

/** 页面里有多份侧边栏（桌面栏 + 抽屉），主题色按钮也必须逐份处理 */
function accentPickers(): AccentPicker[] {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-accent-picker]")).flatMap((pickerRoot) => {
    const toggle = pickerRoot.querySelector<HTMLButtonElement>("[data-accent-toggle]");
    const menu = pickerRoot.querySelector<HTMLElement>("[data-accent-menu]");
    const dot = pickerRoot.querySelector<HTMLElement>("[data-accent-dot]");
    return toggle && menu && dot ? [{ root: pickerRoot, toggle, menu, dot }] : [];
  });
}

function storedAccent(items: AccentItem[]) {
  let stored = "";
  try {
    stored = localStorage.getItem(STORAGE_ACCENT) ?? "";
  } catch {
    /* 忽略 */
  }

  // 早期版本可能存过已删掉的预设（比如电紫），这里统一回落到默认色
  const active = items.some((item) => item.value === stored) ? stored : "";

  if (!active) {
    root.removeAttribute("data-accent");
    try {
      localStorage.removeItem(STORAGE_ACCENT);
    } catch {
      /* 忽略 */
    }
  }

  return active;
}

function accentMenuMarkup(items: AccentItem[], active: string) {
  return items
    .map((item) => {
      const selected = item.value === active;
      return `<button type="button" role="menuitemradio" aria-checked="${selected}" data-accent-value="${item.value}" class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors ${
        selected ? "bg-slate-100 font-medium text-slate-950" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }"><span class="h-3 w-3 flex-none rounded-full" style="background-color:${item.color}"></span><span class="flex-1 text-left">${item.label}</span>${
        selected
          ? '<svg class="h-3.5 w-3.5 flex-none text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>'
          : ""
      }</button>`;
    })
    .join("");
}

function buildAccentMenu() {
  const items = readAccents();
  const active = storedAccent(items);
  const current = items.find((item) => item.value === active) ?? items[0];

  for (const picker of accentPickers()) {
    picker.menu.innerHTML = accentMenuMarkup(items, active);
    picker.dot.style.backgroundColor = current.color;
    picker.toggle.setAttribute("aria-label", `主题色：${current.label}`);
    picker.toggle.setAttribute("title", `主题色：${current.label}`);
  }
}

function setAccentMenuOpen(picker: AccentPicker, open: boolean) {
  picker.menu.toggleAttribute("hidden", !open);
  picker.toggle.setAttribute("aria-expanded", String(open));
  picker.toggle.classList.toggle("bg-slate-100", open);
  picker.toggle.classList.toggle("text-slate-900", open);
}

function closeAccentMenu(exceptRoot?: HTMLElement) {
  for (const picker of accentPickers()) {
    if (picker.root !== exceptRoot) setAccentMenuOpen(picker, false);
  }
}

function setAccent(value: string) {
  if (value) root.setAttribute("data-accent", value);
  else root.removeAttribute("data-accent");

  try {
    if (value) localStorage.setItem(STORAGE_ACCENT, value);
    else localStorage.removeItem(STORAGE_ACCENT);
  } catch {
    /* 忽略 */
  }

  closeAccentMenu();
  buildAccentMenu();
}

function toggleDrawer(open: boolean) {
  root.toggleAttribute("data-nav-open", open);

  const button = document.querySelector<HTMLButtonElement>("[data-mobile-drawer-toggle]");
  if (button) {
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "关闭导航菜单" : "打开导航菜单");
  }
}

function setupHeaderHeight() {
  const inner = document.querySelector<HTMLElement>("[data-site-header-inner]");
  if (!inner) return;

  const update = () => {
    const height = Math.round(inner.getBoundingClientRect().height);
    root.style.setProperty("--site-header-height", `${height}px`);
  };

  update();
  new ResizeObserver(update).observe(inner);
}

function setupBackToTop() {
  const button = document.querySelector<HTMLButtonElement>("[data-back-to-top]");
  if (!button) return;

  const update = () => {
    const visible = window.scrollY > 320;
    button.toggleAttribute("data-visible", visible);
    button.setAttribute("aria-hidden", String(!visible));
    button.tabIndex = visible ? 0 : -1;
  };

  update();
  window.addEventListener("scroll", update, { passive: true });

  button.addEventListener("click", () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  });
}

function setupNavigation() {
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (target.closest("[data-search-open]")) {
      event.preventDefault();
      void import("./search").then((module) => module.openDesktop());
      return;
    }

    if (target.closest("[data-mobile-search-toggle]")) {
      void import("./search").then((module) => module.toggleMobile());
      return;
    }

    const link = target.closest<HTMLAnchorElement>("a[data-nav-link]");
    if (link) {
      window.dispatchEvent(new Event("site-nav-reset"));
      toggleDrawer(false);

      const samePath =
        link.origin === window.location.origin &&
        link.pathname.replace(/\/+$/, "") === window.location.pathname.replace(/\/+$/, "");

      if (samePath && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    if (target.closest("[data-theme-toggle]")) {
      applyTheme(root.getAttribute("data-theme") !== "dark");
      return;
    }

    if (target.closest("[data-sidebar-toggle]")) {
      applySidebar(!root.hasAttribute("data-sidebar-collapsed"));
      return;
    }

    if (target.closest("[data-mobile-drawer-toggle]")) {
      toggleDrawer(!root.hasAttribute("data-nav-open"));
      return;
    }

    const option = target.closest<HTMLElement>("[data-accent-value]");
    if (option) {
      setAccent(option.dataset.accentValue ?? "");
      return;
    }

    const accentToggle = target.closest<HTMLElement>("[data-accent-toggle]");
    if (accentToggle) {
      const picker = accentPickers().find((entry) => entry.root.contains(accentToggle));
      if (picker) {
        const open = picker.menu.hasAttribute("hidden");
        setAccentMenuOpen(picker, open);
        if (open) closeAccentMenu(picker.root);
      }
      return;
    }

    if (!target.closest("[data-accent-picker]")) closeAccentMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAccentMenu();
      toggleDrawer(false);
    }
  });

  window.matchMedia("(min-width: 1024px)").addEventListener("change", (event) => {
    if (event.matches) toggleDrawer(false);
  });
}

function setupSidebarBreakpoint() {
  const media = window.matchMedia("(min-width: 1024px) and (max-width: 1279px)");

  const apply = () => {
    const narrow = media.matches;
    let stored: string | null = null;

    try {
      stored = localStorage.getItem(STORAGE_SIDEBAR);
    } catch {
      /* 忽略 */
    }

    root.toggleAttribute("data-sidebar-collapsed", narrow ? stored !== "0" : false);
    syncSidebarButton();
  };

  apply();
  media.addEventListener("change", () => {
    const narrow = media.matches;
    try {
      localStorage.setItem(STORAGE_SIDEBAR, narrow ? "1" : "0");
    } catch {
      /* 忽略 */
    }
    root.toggleAttribute("data-sidebar-collapsed", narrow);
    syncSidebarButton();
  });
}

syncThemeButton();
syncSidebarButton();
buildAccentMenu();
setupHeaderHeight();
setupBackToTop();
setupNavigation();
setupSidebarBreakpoint();

// 搜索脚本按需加载；空闲时预取一次，点开时就不用等下载
const preloadSearch = () => {
  void import("./search");
};

if (typeof window.requestIdleCallback === "function") {
  window.requestIdleCallback(preloadSearch, { timeout: 3000 });
} else {
  window.setTimeout(preloadSearch, 2000);
}

export {};
