import { loadPageData, seoSchema } from "@/modules/content";

export const themesPage = loadPageData("themes", {
  seo: seoSchema,
});
