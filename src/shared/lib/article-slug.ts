/** 文章 slug 控制在 48 字符内，路径短才利于收录与分享 */
export const MAX_SLUG_LENGTH = 48;

/**
 * 站点侧的文章 slug 契约。
 * 由内容生产流程按规则生成，构建校验只判断是否符合规则。
 */
export function isValidArticleSlug(subcategory: string, slug: string) {
  if (slug.length > MAX_SLUG_LENGTH) {
    return false;
  }

  const word = "[a-z0-9]+(?:-[a-z0-9]+)*";

  if (subcategory === "pricing") {
    return new RegExp(`^${word}-pricing$`).test(slug);
  }

  if (subcategory === "release") {
    return new RegExp(`^[a-z0-9]+(?:-[a-z0-9]+)+$`).test(slug);
  }

  return new RegExp(`^${word}$`).test(slug);
}
