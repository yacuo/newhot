import { loadPageData, seoSchema } from "@/entities/article/model";

export const themesPage = loadPageData("themes", {
  seo: seoSchema,
});
