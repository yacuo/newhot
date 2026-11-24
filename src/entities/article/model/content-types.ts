import { readConfigJson } from "@/shared/config/read-config";
import { contentTypesConfigSchema, formatConfigError } from "@/shared/config/schemas";

export type ContentTypeId = "release" | "update" | "preview" | "incident" | "fix" | "tutorial" | "compare" | "benchmark";

export type ContentType = {
  id: ContentTypeId;
  label: string;
  description: string;
};

const parsedConfig = contentTypesConfigSchema.safeParse(readConfigJson("global/content-types.json"));

if (!parsedConfig.success) {
  throw new Error(formatConfigError(parsedConfig.error, "config/global/content-types.json"));
}

const config = parsedConfig.data;

export const contentTypes = config.types as ContentType[];

export const contentTypeIds = contentTypes.map((type) => type.id);

export const contentTypeDefaults = config.defaults as Record<string, ContentTypeId>;

export function isContentTypeId(value: string): value is ContentTypeId {
  return contentTypeIds.includes(value as ContentTypeId);
}

export function resolveContentType(category: string, subcategory: string, explicit?: string): ContentTypeId | null {
  if (explicit && isContentTypeId(explicit)) {
    return explicit;
  }

  return contentTypeDefaults[`${category}/${subcategory}`] ?? null;
}

export function getContentTypeLabel(id: ContentTypeId) {
  return contentTypes.find((type) => type.id === id)?.label ?? id;
}
