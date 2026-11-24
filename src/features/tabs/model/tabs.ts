const ACTIVE = ["pill-active", "bg-indigo-600", "font-semibold", "text-white"];
const IDLE = ["text-slate-600", "hover:bg-raised", "hover:text-slate-950"];

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const tab = target.closest<HTMLElement>("[data-tab-target]");
  if (!tab) return;

  const group = tab.closest<HTMLElement>("[data-tabs]");
  if (!group) return;

  const id = tab.dataset.tabTarget;

  for (const item of Array.from(group.querySelectorAll<HTMLElement>("[data-tab-target]"))) {
    const isActive = item === tab;
    item.setAttribute("aria-pressed", String(isActive));
    item.classList.remove(...ACTIVE, ...IDLE);
    item.classList.add(...(isActive ? ACTIVE : IDLE));
  }

  for (const panel of Array.from(document.querySelectorAll<HTMLElement>("[data-tab-panel]"))) {
    panel.toggleAttribute("hidden", panel.dataset.tabPanel !== id);
  }
});

export {};
