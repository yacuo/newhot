import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { readListItems } from "@/entities/article/model/article-feed-server";
import { DATA_DIR } from "@/entities/article/model/paths";
import { getCompany, resolveModelName, resolveProduct } from "./model";

export const historyKindSchema = z.enum([
  "founding",
  "project-start",
  "model",
  "product",
  "research",
  "org",
  "funding",
  "milestone",
]);

export type HistoryKind = z.infer<typeof historyKindSchema>;

const highlightSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

export const eventSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  /** YYYY 或 YYYY-MM 或 YYYY-MM-DD，按 datePrecision 解读 */
  date: z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, "date 必须是 YYYY、YYYY-MM 或 YYYY-MM-DD"),
  datePrecision: z.enum(["day", "month", "year"]),
  kind: historyKindSchema,
  title: z.string().min(1).max(24, "title 不超过 24 字"),
  summary: z.string().max(60).optional(),
  productId: z.string().min(1).optional(),
  highlights: z.array(highlightSchema).default([]),
  /** 有对应站内文章时填文章路径，卡片可点击 */
  articleHref: z.string().min(1).optional(),
  /** reference：外部史实；site：站内撰写 */
  origin: z.enum(["reference", "site"]).default("reference"),
  verified: z.boolean().default(false),
  importance: z.number().int().min(1).max(3).default(1),
  source: z.object({
    title: z.string().min(1),
    url: z.string().min(1),
    accessedAt: z.string().optional(),
  }),
});

export type HistoryEvent = z.infer<typeof eventSchema>;

const historyFileSchema = z.object({
  version: z.number().int(),
  companyId: z.string().min(1).optional(),
  updatedAt: z.string(),
  events: z.array(eventSchema),
});

let cache: HistoryEvent[] | null = null;

/** 构建期读取 data/vendors/history/<companyId>.json；数据不合法直接失败，避免坏数据上线 */
export function getAllHistoryEvents(): HistoryEvent[] {
  if (cache) return cache;

  const historyDir = path.join(DATA_DIR, "vendors", "history");

  if (!fs.existsSync(historyDir)) {
    cache = [];
    return cache;
  }

  const files = fs
    .readdirSync(historyDir)
    .filter((file) => file.endsWith(".json"))
    .sort();

  const events: HistoryEvent[] = [];
  const ids = new Set<string>();

  for (const file of files) {
    const companyId = file.slice(0, -".json".length);
    const filePath = path.join(historyDir, file);

    let raw: unknown;

    try {
      raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (error) {
      throw new Error(`data/vendors/history/${file} 不是合法 JSON：${(error as Error).message}`);
    }

    const parsed = historyFileSchema.safeParse(raw);

    if (!parsed.success) {
      const detail = parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "根对象"}: ${issue.message}`)
        .join("；");
      throw new Error(`data/vendors/history/${file} 校验失败：${detail}`);
    }

    if (parsed.data.companyId && parsed.data.companyId !== companyId) {
      throw new Error(`data/vendors/history/${file}: companyId 与文件名不一致（${parsed.data.companyId}）`);
    }

    for (const event of parsed.data.events) {
      if (event.companyId !== companyId) {
        throw new Error(`data/vendors/history/${file}: 事件 ${event.id} 的 companyId 是 ${event.companyId}`);
      }

      if (ids.has(event.id)) {
        throw new Error(`data/vendors/history/${file}: id 重复（${event.id}）`);
      }

      ids.add(event.id);
      events.push(event);
    }
  }

  cache = events;
  return cache;
}

/** 按公司取事件，按日期升序；年/月精度的日期补零对齐，保证排序稳定 */
export function getCompanyHistory(companyId: string): HistoryEvent[] {
  // 只有大模型公司维护发展史；工具、基础设施与办公类公司不展示时间轴
  if (getCompany(companyId)?.tier !== "model") return [];

  const reference = linkReferenceEvents(
    companyId,
    getAllHistoryEvents().filter((event) => event.companyId === companyId),
  );
  const siteEvents = buildSiteEvents(companyId, reference);
  // 同一天同一类发布：保留能跳到站内文章的节点，史实节点让位，避免出现两条重复卡片
  const covered = new Set(siteEvents.map((event) => `${event.date}|${event.kind}`));
  const merged = [
    ...reference.filter((event) => !covered.has(`${event.date}|${event.kind}`)),
    ...siteEvents,
  ];

  return merged.sort((a, b) => padDate(a.date).localeCompare(padDate(b.date)) || a.id.localeCompare(b.id));
}

function normalizeTitle(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, "");
}

/**
 * 给史实节点补站内文章链接：同一公司、日期相差不超过 180 天，
 * 且史实标题里能直接找到文章的模型名或产品名时才关联。
 * 不做模糊词匹配，宁可少链，避免把不相关文章挂到发展史上。
 */
function linkReferenceEvents(companyId: string, reference: HistoryEvent[]): HistoryEvent[] {
  if (reference.length === 0) return reference;

  const company = getCompany(companyId);
  const items = readListItems(`_companies/${companyId}`);

  if (!company || items.length === 0) return reference;

  const dayDiff = (left: string, right: string) =>
    Math.abs(new Date(left).getTime() - new Date(right).getTime()) / 86_400_000;

  return reference.map((event) => {
    if (event.articleHref) return event;

    const eventTitle = normalizeTitle(event.title);
    const candidates = items
      .map((item) => ({ item, diff: dayDiff(item.date, event.date) }))
      .filter(({ diff }) => diff <= 180)
      .sort((a, b) => a.diff - b.diff);

    for (const { item } of candidates) {
      const modelKey = normalizeTitle(resolveModelName(company, item.tags, item.title, item.type));

      // 必须带版本号，避免“Claude / Qwen / MiniMax”这类族名把同公司所有事件都链到同一篇
      if (modelKey.length >= 5 && /\d/.test(modelKey) && eventTitle.includes(modelKey)) {
        return { ...event, articleHref: item.href };
      }
    }

    return event;
  });
}

/**
 * 把站内文章并进时间轴：只收「正式发布」这类事件（模型 / 产品上线），
 * 版本更新、定价调整、故障、行业对话都不算发展史，否则时间轴会变成文章流。
 * 标题也不用文章标题，而是模型名这类短标签，保证一行内能完整显示。
 */
function buildSiteEvents(companyId: string, reference: HistoryEvent[]): HistoryEvent[] {
  // 没有史实底座的公司不拼站内事件，否则「发展史」会从 2026 年突然开始
  if (reference.length === 0) return [];

  const company = getCompany(companyId);
  const items = readListItems(`_companies/${companyId}`);

  if (!company || items.length === 0) return [];

  // 「版本更新 / 模型更新」属于日常迭代；「模型广场」是同版本二次上架。
  // 两者都不进发展史，否则会变成更新日志或重复卡片。
  const releases = items.filter(
    (item) =>
      item.type === "release" &&
      !item.tags.some((tag) => /版本更新|模型更新|模型广场/.test(tag)),
  );

  return releases.flatMap((item) => {
    const modelName = resolveModelName(company, item.tags, item.title, item.type);
    // 带版本号的是模型发布，其余按产品发布（Sora / 搜索 API 这类）标
    const kind: HistoryKind = /\d/.test(modelName) ? "model" : "product";
    const product = resolveProduct(company, item.tags, item.title);

    // 与史实节点重复时跳过，避免同一天出现两条同一件事
    if (reference.some((event) => event.date === item.date && event.kind === kind)) return [];

    const normalized = normalizeTitle(item.title);

    if (
      reference.some((event) => {
        const fact = normalizeTitle(event.title);

        return fact === normalized || fact.includes(normalized) || normalized.includes(fact);
      })
    ) {
      return [];
    }

    // 站内标题会带「系列上线模型广场」等尾巴，和史实标题对不上；用模型名做二次去重，
    // 避免同一模型因发稿日期不同出现两张卡片。产品族名（如 Gemini）太宽泛，不做该判断。
    const modelKey = normalizeTitle(modelName);
    const familyNames = [
      company.name,
      ...company.aliases,
      ...company.products.map((product) => product.name),
    ].map(normalizeTitle);

    if (
      modelKey.length >= 5 &&
      !familyNames.includes(modelKey) &&
      reference.some((event) => normalizeTitle(event.title).includes(modelKey))
    ) {
      return [];
    }

    return [
      {
        id: `site-${item.href}`,
        companyId,
        date: item.date,
        datePrecision: "day",
        kind,
        title: fitOneLine(modelName),
        highlights: product ? [{ label: "产品", value: product.name }] : [],
        articleHref: item.href,
        origin: "site",
        verified: true,
        importance: 3,
        source: { title: "站内报道", url: item.href },
      } satisfies HistoryEvent,
    ];
  });
}

/**
 * 站内事件的标题：模型名 + 「发布」。
 * 只有确认整串能在一行内放下才加「发布」，否则只留模型名；
 * 模型 ID 太长时先在分隔符处收短，保证卡片里永远不出现省略号。
 */
function fitOneLine(name: string, maxUnits = 11.5) {
  const short = shorten(name, maxUnits);
  const withSuffix = `${short} 发布`;

  return displayWidth(withSuffix) <= maxUnits ? withSuffix : short;
}

/** 超宽的模型名按分隔符收短，实在没有分隔符才按宽度硬截 */
function shorten(value: string, maxUnits: number) {
  const trimmed = value.trim();

  if (displayWidth(trimmed) <= maxUnits) return trimmed;

  let out = "";
  let units = 0;

  for (const char of trimmed) {
    const width = /[\x00-\x7F]/.test(char) ? 0.6 : 1;

    if (units + width > maxUnits) break;
    out += char;
    units += width;
  }

  // 尽量停在 - 空格 · 之后，避免留下半个单词
  const boundary = Math.max(out.lastIndexOf("-"), out.lastIndexOf(" "), out.lastIndexOf("·"));

  if (boundary > 0) out = out.slice(0, boundary);

  return out.trim().replace(/[-–—·,，、]+$/, "") || trimmed.slice(0, 1);
}

/** 显示宽度：中文按 1 个字宽，英文/数字按 0.6 折算 */
function displayWidth(value: string) {
  let units = 0;

  for (const char of value) {
    units += /[\x00-\x7F]/.test(char) ? 0.6 : 1;
  }

  return units;
}

function padDate(date: string) {
  if (date.length === 4) return `${date}-00-00`;
  if (date.length === 7) return `${date}-00`;
  return date;
}
