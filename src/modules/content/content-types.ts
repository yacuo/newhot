import config from "@/schema/content-types.json";

export type ContentTypeId = "release" | "update" | "preview" | "incident" | "fix" | "tutorial" | "compare" | "benchmark";

export type ContentType = {
  id: ContentTypeId;
  label: string;
  description: string;
};

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
