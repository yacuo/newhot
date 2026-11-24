/**
 * 统计与站长验证配置。
 *
 * 取值全部来自项目根目录 `.env` 里的 `PUBLIC_*` 变量：
 * 留空 = 该段代码完全不输出，站点不受影响；填上后重新 `npm run build` 即生效
 * （静态站没有运行时配置，改环境变量必须重新构建）。
 *
 * 预览构建（SITE_NOINDEX=1）和本地 dev 不输出统计代码，避免测试流量污染报表。
 */
function readEnv(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export const analyticsConfig = {
  /** Google Analytics 4 衡量 ID，形如 G-XXXXXXXXXX */
  googleAnalyticsId: readEnv(import.meta.env.PUBLIC_GA_ID),
  /** 百度统计站点 ID，即 hm.js? 后面那串 */
  baiduTongjiId: readEnv(import.meta.env.PUBLIC_BAIDU_TONGJI_ID),
  /** 必应站长工具验证码，即 msvalidate.01 的 content */
  bingVerification: readEnv(import.meta.env.PUBLIC_BING_VERIFICATION),
};
