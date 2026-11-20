export type SearchPromotion = {
  title: string;
  description: string;
  href: string;
  external?: boolean;
  enabled?: boolean;
  alwaysShow?: boolean;
  keywords?: string[];
};

export const searchConfig = {
  promotions: [
    {
      title: "NewHot AI 热点",
      description: "持续更新大模型、AI 智能体、AI 编程、AI 办公和 AI 硬件方向的热点资讯。",
      href: "/",
      alwaysShow: true,
      keywords: ["ai", "大模型", "智能体", "编程", "办公", "硬件"],
    },
  ] satisfies SearchPromotion[],
} as const;
