import { channels, type Channel, type ChannelSubcategory } from "./model";

export * from "./accents";

export type Subcategory = ChannelSubcategory;
export type Topic = Channel;

export const topics: Topic[] = channels;

export const channelTopics = topics;

export function getTopicById(id: string) {
  return topics.find((topic) => topic.id === id) ?? null;
}

export function getTopicLabel(id: string) {
  return getTopicById(id)?.label ?? id;
}

export function getSubcategory(topicId: string, subcategoryId: string) {
  return getTopicById(topicId)?.subcategories.find((item) => item.id === subcategoryId) ?? null;
}

export function getSubcategoryLabel(topicId: string, subcategoryId: string) {
  return getSubcategory(topicId, subcategoryId)?.label ?? subcategoryId;
}

export function topicHref(id: string) {
  return `/${id}/`;
}

export function subcategoryHref(topicId: string, subcategoryId: string) {
  return `/${topicId}/${subcategoryId}/`;
}
