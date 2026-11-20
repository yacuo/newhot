import { loadPageData, seoSchema } from "@/modules/content";

export const homePage = loadPageData("home", {
  seo: seoSchema,
});
