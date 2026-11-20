export const pageContainerClass =
  "mx-auto w-full max-w-[1200px] min-[1440px]:max-w-[1360px] min-[1800px]:max-w-[1480px] min-[1920px]:max-w-[1560px] min-[2560px]:max-w-[1680px] px-5 py-3 md:py-5 xl:px-10";

export const widePageContainerClass = "w-full px-5 py-3 md:py-5 lg:px-6";

export const pagePanelClass = "rounded-2xl bg-surface panel-glow p-5 md:p-7";

/** 不带角落光晕的面板：发展史这类需要干净底色的区块用 */
export const flatPagePanelClass = "rounded-2xl bg-surface p-5 md:p-7";

export const sidePanelClass = "rounded-2xl bg-surface panel-glow p-5";

/** 胶囊导航托盘：中性灰底 + 6px 内边距，让紫色胶囊四周留出均匀的灰边 */
export const pillTrayClass =
  "inline-flex w-max items-center gap-0.5 rounded-full bg-slate-200 p-1.5";

/** 选中的胶囊：实心品牌色，全站唯一允许的高饱和小块 */
export const pillActiveClass = "pill-active bg-indigo-600 font-semibold text-white";

/** 未选中的胶囊 */
export const pillIdleClass = "text-slate-600 hover:bg-raised hover:text-slate-950";

/** 胶囊里的计数：选中时压在实色上，用半透明白 */
export const pillCountClass = (active: boolean) =>
  `pill-count font-mono text-[11px] ${active ? "text-white/70" : "text-slate-400"}`;
