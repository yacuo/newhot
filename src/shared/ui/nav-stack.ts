const STORAGE_KEY = "newhot:nav-stack";
const MAX_ENTRIES = 30;

/**
 * 记录站内访问路径，供「返回」按钮判断来路。
 * 静态导出下每次站内跳转仍是客户端导航，浏览器 document.referrer 不会更新，
 * 所以自己维护一份 sessionStorage 栈。
 */
export function readNavStack(): string[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function pushNavStack(pathname: string) {
  try {
    const stack = readNavStack();

    if (stack[stack.length - 1] === pathname) {
      return;
    }

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...stack, pathname].slice(-MAX_ENTRIES)));
  } catch {
    // 隐私模式禁用 sessionStorage 时忽略，返回按钮会退回静态链接
  }
}

/** 当前页在栈里的前一条；没有站内来路（直接打开、从站外进入）时返回 null */
export function getPreviousPath(pathname: string): string | null {
  const stack = readNavStack();
  const index = stack.lastIndexOf(pathname);

  return index > 0 ? stack[index - 1] : null;
}
