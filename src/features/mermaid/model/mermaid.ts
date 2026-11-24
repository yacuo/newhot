const nodes = Array.from(document.querySelectorAll<HTMLElement>("pre > code.language-mermaid"));
if (nodes.length) {
  for (const node of nodes) {
    const container = document.createElement("div");
    container.className = "mermaid";
    container.dataset.source = node.textContent ?? "";
    container.textContent = node.textContent ?? "";
    node.parentElement?.replaceWith(container);
  }

  void (async () => {
    const containers = Array.from(document.querySelectorAll<HTMLElement>(".mermaid"));
    if (!containers.length) return;

    const { default: mermaid } = await import("mermaid");
    for (const container of containers) {
      container.removeAttribute("data-processed");
      container.innerHTML = container.dataset.source ?? "";
    }

    mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "neutral" });
    await mermaid.run({ nodes: containers });
  })().catch(() => undefined);
}
