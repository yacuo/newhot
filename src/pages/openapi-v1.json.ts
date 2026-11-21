import type { APIRoute } from "astro";

const pathParam = (name: string) => ({
  name,
  in: "path",
  required: true,
  schema: { type: "string" },
});

const articleCollection = (summary: string, description: string, names: string[]) => ({
  get: {
    summary,
    description,
    parameters: [
      ...names.map(pathParam),
      {
        name: "limit",
        in: "query",
        schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
      },
      { name: "cursor", in: "query", schema: { type: "string" } },
    ],
    responses: {
      "200": {
        description: "文章列表",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ArticlePage" },
          },
        },
      },
    },
  },
});

const indexDetail = (summary: string, description: string, name: string, schema: string) => ({
  get: {
    summary,
    description,
    parameters: [pathParam(name)],
    responses: {
      "200": {
        description: "索引项",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                site: { type: "string" },
                generatedAt: { type: "string", format: "date-time" },
                window: { $ref: "#/components/schemas/Window" },
                item: { $ref: `#/components/schemas/${schema}` },
              },
            },
          },
        },
      },
      "404": { description: "不存在" },
    },
  },
});

const spec = {
  openapi: "3.1.0",
  info: {
    title: "NewHot API",
    version: "1.2.0",
    description:
      "NewHot 的只读内容接口：AI 大模型新闻、厂商动态、频道、主题、标签与文章元数据。所有接口匿名访问，只返回元数据与摘要；不管查询、单篇、快照还是 MCP，都不返回正文。文章数据只覆盖最近 7 天，响应里的 window 会写明窗口起止。频道、主题、主题分组、厂商、标签、类型都有页面直达地址，返回结构与 /api/v1/articles 一致。所有响应带 X-API-Version: v1，JSON 外层带 apiVersion: v1。限流分四档：文章查询、列表索引、全量快照都是同一条请求 1 次/10 分钟（按 IP + 完整请求计数，换条件不占额度）；MCP 按 IP 汇总 60 次/10 分钟；RSS 不限流。超出返回 429，按 Retry-After 等待（最长 600 秒）。",
  },
  servers: [{ url: "https://newhot.org" }],
  paths: {
    "/api/v1/articles": {
      get: {
        summary: "查询文章",
        description:
          "按频道、二级分类、主题、厂商、标签、类型、关键词和日期区间筛选，按站内发布时间倒序分页返回核心字段。",
        parameters: [
          {
            name: "channel",
            in: "query",
            description: "频道 id",
            schema: {
              type: "string",
              enum: ["llm", "ai-coding", "ai-office", "ai-creation", "troubleshooting"],
            },
          },
          { name: "subcategory", in: "query", description: "二级分类 id", schema: { type: "string" } },
          {
            name: "theme",
            in: "query",
            description: "厂商主题 id，见 /api/v1/themes",
            schema: { type: "string" },
          },
          {
            name: "group",
            in: "query",
            description: "主题下的分组 id，对应主题页胶囊，例如 llm 的 global、cn；必须和 theme 一起用",
            schema: { type: "string" },
          },
          { name: "company", in: "query", description: "厂商 id，见 /api/v1/vendors", schema: { type: "string" } },
          {
            name: "product",
            in: "query",
            description: "厂商下的产品 id，见 /api/v1/vendors/{vendor}/facets；必须和 company 一起用",
            schema: { type: "string" },
          },
          { name: "tag", in: "query", description: "标签精确匹配，见 /api/v1/tags", schema: { type: "string" } },
          {
            name: "type",
            in: "query",
            description: "文章类型，见 /api/v1/meta 的 types",
            schema: { type: "string", enum: ["release", "update", "incident", "fix"] },
          },
          {
            name: "q",
            in: "query",
            description: "关键词，匹配标题、摘要和标签，最多 100 字",
            schema: { type: "string", maxLength: 100 },
          },
          { name: "since", in: "query", description: "起始日期，包含当天", schema: { type: "string", format: "date" } },
          { name: "until", in: "query", description: "结束日期，包含当天", schema: { type: "string", format: "date" } },
          {
            name: "limit",
            in: "query",
            description: "每页条数，默认 20，最大 50",
            schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
          },
          { name: "cursor", in: "query", description: "上一页返回的 nextCursor", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "文章列表",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ArticlePage" },
              },
            },
          },
          "400": { description: "参数错误" },
          "429": {
            description: "请求太密",
            headers: { "Retry-After": { schema: { type: "string" } } },
          },
        },
      },
    },
    "/api/v1/articles/{subcategory}/{slug}": {
      get: {
        summary: "单篇元数据（不含正文）",
        description: "按文章 id 获取一条元数据，id 由二级分类和 slug 拼成。只返回标题、摘要、分类和页面地址，不返回正文；早于 7 天的文章返回 404。",
        parameters: [
          { name: "subcategory", in: "path", required: true, schema: { type: "string" } },
          { name: "slug", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "文章",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    site: { type: "string" },
                    generatedAt: { type: "string", format: "date-time" },
                    item: { $ref: "#/components/schemas/Article" },
                  },
                },
              },
            },
          },
          "404": { description: "文章不存在" },
        },
      },
    },
    "/api/v1/articles/all": {
      get: {
        summary: "全部文章快照",
        description:
          "按站内发布时间倒序返回最近 7 天的全部文章核心字段；限流 1 次/10 分钟/IP，响应 Cache-Control 为 600 秒。日常查询请用 /api/v1/articles。",
        responses: {
          "200": {
            description: "文章列表",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    site: { type: "string" },
                    generatedAt: { type: "string", format: "date-time" },
                    window: { $ref: "#/components/schemas/Window" },
                    total: { type: "integer" },
                    items: { type: "array", items: { $ref: "#/components/schemas/Article" } },
                  },
                },
              },
            },
          },
          "429": { description: "请求太密" },
        },
      },
    },
    "/api/v1/channels/{channel}/articles": articleCollection(
      "频道页文章",
      "等价于 /api/v1/articles?channel={channel}，只返回最近 7 天。",
      ["channel"],
    ),
    "/api/v1/channels/{channel}/{subcategory}/articles": articleCollection(
      "二级分类页文章",
      "等价于 /api/v1/articles?channel={channel}&subcategory={subcategory}，只返回最近 7 天。",
      ["channel", "subcategory"],
    ),
    "/api/v1/subcategories/{subcategory}/articles": articleCollection(
      "二级分类文章",
      "等价于 /api/v1/articles?subcategory={subcategory}，会跨频道匹配同名分类。",
      ["subcategory"],
    ),
    "/api/v1/themes/{theme}/articles": articleCollection(
      "主题页文章",
      "等价于 /api/v1/articles?theme={theme}，只返回最近 7 天。",
      ["theme"],
    ),
    "/api/v1/themes/{theme}/{group}/articles": articleCollection(
      "主题胶囊文章",
      "等价于 /api/v1/articles?theme={theme}&group={group}，group 对应主题页顶部胶囊。",
      ["theme", "group"],
    ),
    "/api/v1/vendors/{vendor}/articles": articleCollection(
      "公司页文章",
      "等价于 /api/v1/articles?company={vendor}，只返回最近 7 天。",
      ["vendor"],
    ),
    "/api/v1/tags/{tag}/articles": articleCollection(
      "标签文章",
      "等价于 /api/v1/articles?tag={tag}；标签含斜杠时用 %2F 编码。",
      ["tag"],
    ),
    "/api/v1/types/{type}/articles": articleCollection(
      "按类型取文章",
      "等价于 /api/v1/articles?type={type}，type 取值见 /api/v1/meta。",
      ["type"],
    ),
    "/api/v1/channels/{channel}": indexDetail(
      "单个频道",
      "频道信息与下属二级分类，统计按最近 7 天算。",
      "channel",
      "Channel",
    ),
    "/api/v1/themes/{theme}": indexDetail(
      "单个主题",
      "主题信息与分组，统计按最近 7 天算。",
      "theme",
      "Theme",
    ),
    "/api/v1/vendors/{vendor}": indexDetail(
      "单个厂商",
      "厂商信息与最近 7 天文章统计。",
      "vendor",
      "Vendor",
    ),
    "/api/v1/vendors/{vendor}/products/{product}/articles": articleCollection(
      "公司 + 产品文章",
      "等价于 /api/v1/articles?company={vendor}&product={product}，只返回最近 7 天。",
      ["vendor", "product"],
    ),
    "/api/v1/vendors/{vendor}/channels/{channel}/articles": articleCollection(
      "公司 + 频道文章",
      "等价于 /api/v1/articles?company={vendor}&channel={channel}。",
      ["vendor", "channel"],
    ),
    "/api/v1/vendors/{vendor}/subcategories/{subcategory}/articles": articleCollection(
      "公司 + 二级分类文章",
      "等价于 /api/v1/articles?company={vendor}&subcategory={subcategory}。",
      ["vendor", "subcategory"],
    ),
    "/api/v1/vendors/{vendor}/facets": {
      get: {
        summary: "公司页胶囊",
        description: "公司页顶部的频道、二级分类、产品胶囊，带最近 7 天的文章数与最近发布时间。",
        parameters: [pathParam("vendor")],
        responses: {
          "200": {
            description: "分面",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    site: { type: "string" },
                    generatedAt: { type: "string", format: "date-time" },
                    window: { $ref: "#/components/schemas/Window" },
                    vendor: { type: "object" },
                    total: { type: "integer" },
                    channels: { type: "array", items: { type: "object" } },
                    subcategories: { type: "array", items: { type: "object" } },
                    products: { type: "array", items: { type: "object" } },
                  },
                },
              },
            },
          },
          "404": { description: "厂商不存在" },
        },
      },
    },
    "/api/v1/channels": {
      get: {
        summary: "频道与二级分类",
        description: "返回频道、二级分类、文章数与最新发布时间。",
        responses: {
          "200": {
            description: "频道列表",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    site: { type: "string" },
                    generatedAt: { type: "string", format: "date-time" },
                    channels: { type: "array", items: { $ref: "#/components/schemas/Channel" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/subcategories": {
      get: {
        summary: "二级分类索引",
        description: "扁平返回全部二级分类，可按频道过滤。",
        parameters: [{ name: "channel", in: "query", schema: { type: "string" } }],
        responses: {
          "200": {
            description: "二级分类列表",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    site: { type: "string" },
                    generatedAt: { type: "string", format: "date-time" },
                    query: { type: "object" },
                    total: { type: "integer" },
                    items: { type: "array", items: { $ref: "#/components/schemas/Subcategory" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/vendors": {
      get: {
        summary: "厂商索引",
        description: "返回跟踪的厂商，带类型、主题、文章数和最近发布时间。可按 tier 或 theme 过滤。",
        parameters: [
          { name: "tier", in: "query", schema: { type: "string", enum: ["model", "tool", "infra"] } },
          { name: "theme", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "厂商列表",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    site: { type: "string" },
                    generatedAt: { type: "string", format: "date-time" },
                    query: { type: "object" },
                    total: { type: "integer" },
                    items: { type: "array", items: { $ref: "#/components/schemas/Vendor" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/themes": {
      get: {
        summary: "主题索引",
        description: "厂商主题与分组，带公司数、文章数和最近发布时间；theme id 可直接用于 /api/v1/articles?theme=。",
        responses: {
          "200": {
            description: "主题列表",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    site: { type: "string" },
                    generatedAt: { type: "string", format: "date-time" },
                    total: { type: "integer" },
                    items: { type: "array", items: { $ref: "#/components/schemas/Theme" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/tags": {
      get: {
        summary: "标签索引",
        description: "按文章数从多到少返回标签，tag 可直接用于 /api/v1/articles?tag=。",
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 1000, default: 200 },
          },
        ],
        responses: {
          "200": {
            description: "标签列表",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    site: { type: "string" },
                    generatedAt: { type: "string", format: "date-time" },
                    total: { type: "integer" },
                    count: { type: "integer" },
                    items: { type: "array", items: { $ref: "#/components/schemas/Tag" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/meta": {
      get: {
        summary: "接口元信息",
        description: "各维度总数、文章类型枚举，以及四档限流规则。",
        responses: {
          "200": {
            description: "元信息",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    site: { type: "string" },
                    generatedAt: { type: "string", format: "date-time" },
                    counts: { type: "object" },
                    types: { type: "array", items: { type: "object" } },
                    limits: { type: "object" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/mcp": {
      post: {
        summary: "MCP JSON-RPC",
        description: "无状态只读 MCP，支持 initialize、tools/list、tools/call。",
        responses: {
          "200": { description: "JSON-RPC 响应" },
          "429": { description: "请求太密" },
        },
      },
    },
    "/api/v1/agent-skill": {
      get: {
        summary: "Agent Skill 原文",
        description: "返回 Agent Skill 的 Markdown 原文，Content-Type 为 text/markdown; charset=utf-8。",
        responses: {
          "200": {
            description: "Markdown 原文",
            content: { "text/markdown": { schema: { type: "string" } } },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      ArticlePage: {
        type: "object",
        properties: {
          apiVersion: { type: "string", enum: ["v1"] },
          site: { type: "string" },
          generatedAt: { type: "string", format: "date-time" },
          window: { $ref: "#/components/schemas/Window" },
          query: {
            type: "object",
            properties: {
              channel: { type: ["string", "null"] },
              subcategory: { type: ["string", "null"] },
              theme: { type: ["string", "null"] },
              group: { type: ["string", "null"] },
              company: { type: ["string", "null"] },
              product: { type: ["string", "null"] },
              tag: { type: ["string", "null"] },
              type: { type: ["string", "null"] },
              q: { type: ["string", "null"] },
              since: { type: ["string", "null"], format: "date" },
              until: { type: ["string", "null"], format: "date" },
              limit: { type: "integer" },
            },
          },
          total: { type: "integer" },
          count: { type: "integer" },
          hasMore: { type: "boolean" },
          nextCursor: { type: ["string", "null"] },
          items: { type: "array", items: { $ref: "#/components/schemas/Article" } },
        },
        required: ["site", "generatedAt", "query", "total", "count", "hasMore", "nextCursor", "items"],
      },
      Window: {
        type: "object",
        properties: {
          days: { type: "integer", description: "只提供最近 N 天的文章" },
          since: { type: "string", format: "date", description: "窗口起始日期，含当天" },
        },
        required: ["days", "since"],
      },
      Article: {
        type: "object",
        properties: {
          id: { type: "string", description: "subcategory/slug" },
          title: { type: "string" },
          description: { type: "string", description: "摘要，不是正文" },
          url: { type: "string", format: "uri" },
          channel: { type: "string" },
          subcategory: { type: "string" },
          publishedAt: { type: "string", format: "date" },
        },
        required: ["id", "title", "description", "url", "channel", "publishedAt"],
      },
      Channel: {
        type: "object",
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          labelEn: { type: "string" },
          description: { type: "string" },
          url: { type: "string", format: "uri" },
          count: { type: "integer" },
          latestPublished: { type: ["string", "null"], format: "date" },
          subcategories: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                label: { type: "string" },
                url: { type: "string", format: "uri" },
                count: { type: "integer" },
                latestPublished: { type: ["string", "null"], format: "date" },
              },
            },
          },
        },
        required: ["id", "label", "url", "count", "subcategories"],
      },
      Subcategory: {
        type: "object",
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          description: { type: "string" },
          url: { type: "string", format: "uri" },
          count: { type: "integer" },
          latestPublished: { type: ["string", "null"], format: "date" },
          channel: { type: "string" },
          channelLabel: { type: "string" },
        },
      },
      Vendor: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          tier: { type: "string", enum: ["model", "tool", "infra"] },
          region: { type: "string", enum: ["cn", "global"] },
          homepage: { type: "string", format: "uri" },
          primaryModel: { type: ["string", "null"] },
          products: { type: "array", items: { type: "object" } },
          url: { type: "string", format: "uri" },
          themes: { type: "array", items: { type: "string" } },
          articleCount: { type: "integer" },
          latestPublished: { type: ["string", "null"], format: "date" },
        },
      },
      Theme: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          eyebrow: { type: "string" },
          description: { type: "string" },
          url: { type: "string", format: "uri" },
          companyCount: { type: "integer" },
          articleCount: { type: "integer" },
          latestPublished: { type: ["string", "null"], format: "date" },
          groups: { type: "array", items: { type: "object" } },
        },
      },
      Tag: {
        type: "object",
        properties: {
          tag: { type: "string" },
          count: { type: "integer" },
        },
      },
    },
  },
};

export const GET: APIRoute = async () =>
  new Response(JSON.stringify(spec, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
      "X-Robots-Tag": "noindex",
    },
  });
