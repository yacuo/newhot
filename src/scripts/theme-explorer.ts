const root = document.querySelector<HTMLElement>("[data-theme-explorer]");

if (root) {
  const ACTIVE = ["pill-active", "bg-indigo-600", "font-semibold", "text-white"];
  const IDLE = ["font-medium", "text-slate-600", "hover:bg-raised", "hover:text-slate-950"];
  const GROUP_ACTIVE = ["pill-active"];
  const GROUP_IDLE = ["text-slate-600", "hover:bg-raised", "hover:text-slate-950"];

  const showTheme = (id: string) => {
    for (const tab of Array.from(root.querySelectorAll<HTMLElement>("[data-theme-tab]"))) {
      const selected = tab.dataset.themeTab === id;
      tab.setAttribute("aria-selected", String(selected));
      tab.classList.remove(...ACTIVE, ...IDLE);
      tab.classList.add(...(selected ? ACTIVE : IDLE));
    }

    for (const meta of Array.from(root.querySelectorAll<HTMLElement>("[data-theme-meta]"))) {
      meta.toggleAttribute("hidden", meta.dataset.themeMeta !== id);
    }

    for (const block of Array.from(root.querySelectorAll<HTMLElement>("[data-theme-block]"))) {
      block.toggleAttribute("hidden", block.dataset.themeBlock !== id);
    }
  };

  const showGroup = (themeId: string, groupId: string) => {
    const block = root.querySelector<HTMLElement>(`[data-theme-block="${themeId}"]`);
    if (!block) return;

    for (const section of Array.from(block.querySelectorAll<HTMLElement>("[data-theme-section]"))) {
      const active = groupId === "all" || section.dataset.themeSection === groupId;
      section.toggleAttribute("hidden", !active);
      const heading = section.querySelector<HTMLElement>("[data-theme-section-heading]");
      if (heading) heading.toggleAttribute("hidden", groupId !== "all");
    }

    const groups = root.querySelector<HTMLElement>(`[data-theme-groups="${themeId}"]`);
    groups?.setAttribute("data-active-group", groupId);
    if (!groups) return;

    for (const button of Array.from(groups.querySelectorAll<HTMLElement>("[data-theme-group]"))) {
      const selected = (button.dataset.themeGroup ?? "all") === groupId;
      button.setAttribute("aria-pressed", String(selected));
      button.classList.toggle("pill-active", selected);
      button.classList.toggle("bg-indigo-600", selected);
      button.classList.toggle("font-semibold", selected);
      button.classList.toggle("text-white", selected);
      button.classList.toggle("text-slate-600", !selected);
      button.classList.toggle("hover:bg-raised", !selected);
      button.classList.toggle("hover:text-slate-950", !selected);
      const count = button.querySelector(".pill-count");
      if (count) {
        count.classList.toggle("text-white/70", selected);
        count.classList.toggle("text-slate-400", !selected);
      }
    }
  };

  root.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const tab = target.closest<HTMLElement>("[data-theme-tab]");
    if (tab) {
      const id = tab.dataset.themeTab ?? "";
      showTheme(id);
      showGroup(id, "all");
      return;
    }

    const group = target.closest<HTMLElement>("[data-theme-group]");
    if (group) {
      const groups = group.closest<HTMLElement>("[data-theme-groups]");
      const themeId = groups?.dataset.themeGroups ?? "";
      showGroup(themeId, group.dataset.themeGroup ?? "all");
    }
  });
}

export {};
