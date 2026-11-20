import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { DATA_DIR } from "@/modules/content/paths";

export type SeoCopy = {
  title: string;
  description: string;
};

export type ChannelSubcategory = {
  id: string;
  label: string;
  description: string;
  seo: SeoCopy;
};

export type ChannelFaq = {
  question: string;
  answer: string;
};

export type ChannelQuote = {
  text: string;
  label: string;
  href: string;
};

/** 频道自己的收录标准，用于页面底部的说明区块；不配置时回退到通用文案 */
export type ChannelStandards = {
  description: string;
  scope: string;
  points: string[];
  sourcesHeading?: string;
  sourcesDescription?: string;
  quote?: ChannelQuote | null;
};

export type Channel = {
  id: string;
  label: string;
  labelEn: string;
  description: string;
  seo: SeoCopy;
  faqs: ChannelFaq[];
  subcategories: ChannelSubcategory[];
  standards?: ChannelStandards;
};

const seoSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
});

const channelConfigSchema = z.object({
  label: z.string().trim().min(1),
  labelEn: z.string().trim().min(1),
  description: z.string().trim().min(1),
  seo: seoSchema,
  faqs: z.array(z.object({ question: z.string().trim().min(1), answer: z.string().trim().min(1) })).default([]),
  standards: z
    .object({
      description: z.string().trim().min(1),
      scope: z.string().trim().min(1),
      points: z.array(z.string().trim().min(1)).min(2),
      sourcesHeading: z.string().trim().min(1).optional(),
      sourcesDescription: z.string().trim().min(1).optional(),
      quote: z
        .object({
          text: z.string().trim().min(1),
          label: z.string().trim().min(1),
          href: z.string().trim().url(),
        })
        .nullable()
        .optional(),
    })
    .optional(),
  order: z.number().int(),
});

const subcategoryConfigSchema = z.object({
  label: z.string().trim().min(1),
  description: z.string().trim().min(1),
  seo: seoSchema,
  order: z.number().int(),
});

const channelsDir = path.join(DATA_DIR, "channels");

function readConfig<T>(filePath: string, schema: z.ZodType<T>, label: string): T {
  let raw: unknown;

  try {
    raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    throw new Error(`${label}: 无法读取或不是合法 JSON（${filePath}）`);
  }

  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "根对象"}: ${issue.message}`)
      .join("；");

    throw new Error(`${label}: 配置不合法（${detail}）`);
  }

  return parsed.data;
}

function listDirectories(dir: string) {
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

/** 目录里是否有真实内容（md 或 json），用于跳过只剩 .DS_Store 的残留目录 */
function hasContent(dir: string): boolean {
  if (!fs.existsSync(dir)) return false;

  return fs.readdirSync(dir, { withFileTypes: true }).some((entry) => {
    if (entry.name.startsWith(".")) return false;

    if (entry.isDirectory()) {
      return hasContent(path.join(dir, entry.name));
    }

    return entry.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".json"));
  });
}

/**
 * 频道与分类配置来自目录结构，一个目录对应一个页面：
 *
 * data/channels/<channel>/channel.json
 * data/channels/<channel>/<subcategory>/subcategory.json
 * data/channels/<channel>/<subcategory>/posts/<slug>.md
 *
 * 分类 id 由目录名推导，order 决定导航顺序。
 * 这里是构建期读取（server only），客户端组件通过 props 接收结果，不要直接 import 本模块。
 */
function loadChannels(): Channel[] {
  const channels = listDirectories(channelsDir).map((channelId) => {
    const channelDir = path.join(channelsDir, channelId);
    const configPath = path.join(channelDir, "channel.json");

    if (!fs.existsSync(configPath)) {
      if (!hasContent(channelDir)) return null;

      throw new Error(`data/channels/${channelId}: 缺少 channel.json`);
    }

    const config = readConfig(configPath, channelConfigSchema, `data/channels/${channelId}/channel.json`);
    const subcategories = listDirectories(channelDir)
      .map((subcategoryId) => {
        const subcategoryDir = path.join(channelDir, subcategoryId);
        const subcategoryConfigPath = path.join(subcategoryDir, "subcategory.json");

        if (!fs.existsSync(subcategoryConfigPath)) {
          if (!hasContent(subcategoryDir)) return null;

          throw new Error(`data/channels/${channelId}/${subcategoryId}: 缺少 subcategory.json`);
        }

        const subcategoryConfig = readConfig(
          subcategoryConfigPath,
          subcategoryConfigSchema,
          `data/channels/${channelId}/${subcategoryId}/subcategory.json`,
        );

        return {
          order: subcategoryConfig.order,
          subcategory: {
            id: subcategoryId,
            label: subcategoryConfig.label,
            description: subcategoryConfig.description,
            seo: subcategoryConfig.seo,
          },
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.order - b.order || a.subcategory.id.localeCompare(b.subcategory.id))
      .map((item) => item.subcategory);

    return {
      order: config.order,
      channel: {
        id: channelId,
        label: config.label,
        labelEn: config.labelEn,
        description: config.description,
        seo: config.seo,
        faqs: config.faqs,
        subcategories,
        standards: config.standards,
      },
    };
  });

  return channels
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.order - b.order || a.channel.id.localeCompare(b.channel.id))
    .map((item) => item.channel);
}

let cache: Channel[] | null = null;

export function getChannels(): Channel[] {
  if (!cache) {
    cache = loadChannels();
  }

  return cache;
}

export const channels = getChannels();
