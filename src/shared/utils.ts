export function formatDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatMonthDay(date: string) {
  const [, month, day] = date.split("-");

  return `${Number(month)}月${Number(day)}日`;
}

export function estimateReadingTime(content: string) {
  const chineseChars = content.match(/[\u4e00-\u9fa5]/g)?.length ?? 0;
  const latinWords = content.match(/[a-zA-Z0-9]+/g)?.length ?? 0;
  const units = chineseChars + latinWords;

  return Math.max(1, Math.ceil(units / 500));
}

/** 产品名与作者名是否指同一实体（如 Leonardo / Leonardo.Ai），用于避免列表里重复展示 */
export function isSameEntity(a?: string | null, b?: string | null) {
  if (!a || !b) return false;

  const normalize = (value: string) => value.toLowerCase().replace(/[\s._-]+/g, "");
  const left = normalize(a);
  const right = normalize(b);

  if (!left || !right) return false;

  return left === right || left.includes(right) || right.includes(left);
}

type ClickLike = {
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  button: number;
  preventDefault: () => void;
};

function normalizePath(path: string) {
  return path.replace(/\/+$/, "") || "/";
}

export const NAV_RESET_EVENT = "site-nav-reset";

let cachedBuildId: string | null = null;

/** 读取构建版本号；服务端渲染阶段返回空字符串 */
export function getBuildId() {
  if (cachedBuildId !== null) {
    return cachedBuildId;
  }

  if (typeof document === "undefined") {
    return "";
  }

  cachedBuildId =
    document.querySelector('meta[name="newhot-build"]')?.getAttribute("content") ?? "";

  return cachedBuildId;
}

/**
 * 给数据文件地址追加构建版本号。
 * 同一构建内地址不变，可以放心长缓存；新构建地址变化，不会读到旧数据。
 */
export function withBuildVersion(url: string) {
  const buildId = getBuildId();

  if (!buildId || buildId === "dev") {
    return url;
  }

  return `${url}${url.includes("?") ? "&" : "?"}v=${encodeURIComponent(buildId)}`;
}

export function scrollToTopWhenSamePath(event: ClickLike, pathname: string, href: string) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
    return;
  }

  // 点击导航时强制恢复默认状态：顶部信息条与频道条都重新显示
  window.dispatchEvent(new Event(NAV_RESET_EVENT));

  if (normalizePath(pathname) !== normalizePath(href)) {
    return;
  }

  event.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
