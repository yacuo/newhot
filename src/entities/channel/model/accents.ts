export type TopicAccent = {
  text: string;
  groupHoverText: string;
  soft: string;
  dot: string;
};

const neutralAccent: TopicAccent = {
  text: "text-slate-600",
  groupHoverText: "group-hover:text-slate-900",
  soft: "bg-slate-100",
  dot: "bg-slate-300",
};

const topicAccents: Record<string, TopicAccent> = {
  llm: neutralAccent,
  "ai-coding": neutralAccent,
  "ai-office": neutralAccent,
  "ai-creation": neutralAccent,
  troubleshooting: neutralAccent,
  companies: neutralAccent,
};

const defaultAccent = topicAccents["ai-office"];

/**
 * 频道主题色。纯静态映射，不依赖频道配置，
 * 因此客户端组件可以直接引用。
 */
export function getTopicAccent(id: string): TopicAccent {
  return topicAccents[id] ?? defaultAccent;
}
