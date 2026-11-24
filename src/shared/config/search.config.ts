import searchJson from "@site-content/config/global/search.json";

export type SearchPromotion = {
  title: string;
  description: string;
  href: string;
  external?: boolean;
  enabled?: boolean;
  alwaysShow?: boolean;
  keywords?: string[];
};

export const searchConfig = searchJson as { promotions: SearchPromotion[] };
