import { readConfigJson } from "./read-config";
import { formatConfigError, sourcesConfigSchema } from "./schemas";

export type SourceLink = {
  name: string;
  href: string;
};

type SourcesConfig = {
  defaultSources: SourceLink[];
  channelSources: Record<string, SourceLink[]>;
  tutorialSources: SourceLink[];
};

const parsedConfig = sourcesConfigSchema.safeParse(readConfigJson("global/sources.json"));

if (!parsedConfig.success) {
  throw new Error(formatConfigError(parsedConfig.error, "config/global/sources.json"));
}

const config = parsedConfig.data;

/** 通用官方渠道：默认用于没有单独配置的频道 */
export const DEFAULT_SOURCES: SourceLink[] = config.defaultSources;

/** 按频道给出更贴近的官方来源，未配置的频道回退到 DEFAULT_SOURCES */
export const CHANNEL_SOURCES: Record<string, SourceLink[]> = config.channelSources;

export function getChannelSources(topicId?: string | null) {
  return (topicId && CHANNEL_SOURCES[topicId]) || DEFAULT_SOURCES;
}

/** 系列教程页的来源：以官方文档为主，避免引用二手教程 */
export const TUTORIAL_SOURCES: SourceLink[] = config.tutorialSources;
