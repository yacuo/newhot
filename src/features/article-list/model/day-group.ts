for (const toggle of Array.from(document.querySelectorAll<HTMLButtonElement>("[data-day-toggle]"))) {
  toggle.addEventListener("click", () => {
    const group = toggle.closest("[data-day-group]");
    const list = group?.querySelector("[data-day-list]");
    if (!list) return;

    const collapsed = !list.hasAttribute("hidden");
    list.toggleAttribute("hidden", collapsed);
    toggle.setAttribute("aria-expanded", String(!collapsed));

    for (const chevron of Array.from(toggle.querySelectorAll("[data-day-chevron]"))) {
      chevron.classList.toggle("-rotate-90", collapsed);
    }
  });
}

export {};
