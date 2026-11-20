const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-toc-link]"));
if (links.length) {
  const items = links
    .map((link) => {
      const id = link.dataset.tocLink ?? "";
      const element = document.getElementById(id);
      return element ? { link, element } : null;
    })
    .filter((item): item is { link: HTMLAnchorElement; element: HTMLElement } => Boolean(item));

  let ticking = false;

  const update = () => {
    ticking = false;
    let active = items[0];

    for (const item of items) {
      if (item.element.getBoundingClientRect().top <= 120) active = item;
      else break;
    }

    for (const item of items) {
      const isActive = item === active;
      item.link.setAttribute("aria-current", isActive ? "true" : "false");
      item.link.style.borderLeftColor = isActive ? "var(--primary)" : "";
      item.link.style.color = isActive ? "var(--primary)" : "";
    }
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
}

const tocButton = document.querySelector<HTMLButtonElement>("[data-mobile-toc-toggle]");
const tocPanel = document.querySelector<HTMLElement>("[data-mobile-toc]");

if (tocButton && tocPanel) {
  const setOpen = (open: boolean) => {
    document.documentElement.toggleAttribute("data-toc-open", open);
    tocButton.setAttribute("aria-expanded", String(open));
    tocButton.setAttribute("aria-label", open ? "关闭文章目录" : "打开文章目录");
  };

  tocButton.addEventListener("click", () => setOpen(!document.documentElement.hasAttribute("data-toc-open")));
  document.querySelector("[data-mobile-toc-close]")?.addEventListener("click", () => setOpen(false));

  for (const link of Array.from(document.querySelectorAll("[data-mobile-toc-link]"))) {
    link.addEventListener("click", () => setOpen(false));
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
}

export {};
