const scroller = document.querySelector<HTMLElement>("[data-history-scroll]");

if (scroller) {
  const prev = document.querySelector<HTMLButtonElement>("[data-history-prev]");
  const next = document.querySelector<HTMLButtonElement>("[data-history-next]");
  const leftFade = document.querySelector<HTMLElement>('[data-history-fade="left"]');
  const rightFade = document.querySelector<HTMLElement>('[data-history-fade="right"]');

  let dragging = false;
  let dragStartX = 0;
  let dragStartLeft = 0;
  let moved = false;
  let dragged = false;
  let samples: { x: number; t: number }[] = [];
  let momentum: number | null = null;

  const updateEdges = () => {
    const left = scroller.scrollLeft > 1;
    const right = scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1;
    if (prev) prev.disabled = !left;
    if (next) next.disabled = !right;
    leftFade?.toggleAttribute("hidden", !left);
    rightFade?.toggleAttribute("hidden", !right);
    scroller.style.cursor = dragging ? "grabbing" : left || right ? "grab" : "";
  };

  const stopMomentum = () => {
    if (momentum !== null) cancelAnimationFrame(momentum);
    momentum = null;
  };

  const pageBy = (direction: number) => {
    stopMomentum();
    const items = scroller.querySelectorAll<HTMLElement>("[data-history-item]");
    if (!items.length) return;

    const step = items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : items[0].offsetWidth;
    const perScreen = Math.max(1, Math.floor(scroller.clientWidth / step));
    const max = scroller.scrollWidth - scroller.clientWidth;
    const desired = scroller.scrollLeft + direction * perScreen * step;
    let target = Math.min(max, Math.max(0, Math.round(desired / step) * step));

    if (max - target < step / 2) target = max;
    scroller.scrollTo({ left: target, behavior: "smooth" });
  };

  const startMomentum = (velocity: number) => {
    stopMomentum();
    let speed = Math.max(-2.4, Math.min(2.4, velocity));
    let last = performance.now();

    const step = (now: number) => {
      const dt = Math.min(now - last, 48);
      last = now;
      speed *= Math.pow(0.997, dt);

      const before = scroller.scrollLeft;
      scroller.scrollLeft = before + speed * dt;

      if (Math.abs(speed) < 0.02 || scroller.scrollLeft === before) {
        momentum = null;
        return;
      }
      momentum = requestAnimationFrame(step);
    };

    momentum = requestAnimationFrame(step);
  };

  scroller.scrollLeft = scroller.scrollWidth;

  scroller.addEventListener(
    "pointerdown",
    (event) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      stopMomentum();
      dragging = true;
      moved = false;
      dragged = false;
      dragStartX = event.clientX;
      dragStartLeft = scroller.scrollLeft;
      samples = [{ x: event.clientX, t: performance.now() }];
    },
    { passive: true },
  );

  scroller.addEventListener(
    "pointermove",
    (event) => {
      if (!dragging) return;
      const delta = event.clientX - dragStartX;

      if (!moved) {
        if (Math.abs(delta) <= 4) return;
        moved = true;
        dragged = true;
        scroller.setPointerCapture(event.pointerId);
        updateEdges();
      }

      scroller.scrollLeft = dragStartLeft - delta;

      const now = performance.now();
      samples.push({ x: event.clientX, t: now });
      samples = samples.filter((sample) => now - sample.t <= 120).slice(-6);
    },
    { passive: true },
  );

  const endDrag = (event: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    updateEdges();
    if (moved) scroller.releasePointerCapture?.(event.pointerId);
    moved = false;

    const [first, last] = [samples[0], samples[samples.length - 1]];
    samples = [];
    if (!first || !last) return;

    const duration = last.t - first.t;
    if (duration <= 0) return;

    const velocity = -(last.x - first.x) / duration;
    if (Math.abs(velocity) > 0.05) startMomentum(velocity);
  };

  scroller.addEventListener("pointerup", endDrag);
  scroller.addEventListener("pointercancel", endDrag);

  const onClick = (event: MouseEvent) => {
    if (!dragged) return;
    event.preventDefault();
    event.stopPropagation();
    dragged = false;
  };
  scroller.addEventListener("click", onClick, true);

  prev?.addEventListener("click", () => pageBy(-1));
  next?.addEventListener("click", () => pageBy(1));
  scroller.addEventListener("scroll", updateEdges, { passive: true });
  window.addEventListener("resize", updateEdges);

  updateEdges();
}

export {};
