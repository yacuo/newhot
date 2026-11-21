import { z } from "zod";
import { loadPageData, seoSchema } from "@/modules/content";

const toneSchema = z.enum(["emerald", "sky", "violet", "teal", "amber", "indigo", "fuchsia"]);

const badgeSchema = z.object({
  label: z.string().min(1, "badges.label 不能为空"),
  tone: toneSchema,
});

const headerSchema = z.object({
  title: z.string().min(1, "header.title 不能为空"),
  description: z.string().min(1, "header.description 不能为空"),
});

const linkItemSchema = z.object({
  label: z.string().min(1, "label 不能为空"),
  href: z.string().min(1, "href 不能为空"),
  note: z.string().min(1, "note 不能为空"),
});

const labeledTextSchema = z.object({
  label: z.string().min(1, "label 不能为空"),
  text: z.string().min(1, "text 不能为空"),
});

const textListSchema = z.object({
  title: z.string().min(1, "title 不能为空"),
  description: z.string().min(1, "description 不能为空").optional(),
  items: z.array(z.string().min(1)).min(1, "items 至少一条"),
});

/**
 * Agent 接入页面的共用配置：侧栏分组、四张方式卡与共同约定。
 * 五个页面共用这一份，避免在组件里写死文案。
 */
export const agentPage = loadPageData("agent", {
  nav: z.object({
    cards: z
      .array(
        z.object({
          name: z.string().min(1, "cards.name 不能为空"),
          href: z.string().min(1, "cards.href 不能为空"),
          icon: z.enum(["Radio", "CodeXml", "Route", "WandSparkles"]),
          tone: z.enum(["orange", "sky", "violet", "emerald"]),
          short: z.string().min(1, "cards.short 不能为空"),
          description: z.string().min(1, "cards.description 不能为空"),
          meta: z.string().min(1, "cards.meta 不能为空"),
        }),
      )
      .min(1, "cards 至少一张"),
    groups: z
      .array(
        z.object({
          title: z.string().min(1, "groups.title 不能为空"),
          description: z.string().min(1, "groups.description 不能为空"),
          showOverview: z.boolean().optional(),
          entries: z
            .array(
              z.object({
                label: z.string().min(1, "entries.label 不能为空"),
                href: z.string().min(1, "entries.href 不能为空"),
                note: z.string().min(1, "entries.note 不能为空"),
              }),
            )
            .min(1, "entries 至少一条"),
        }),
      )
      .min(1, "groups 至少一组"),
    conventions: z.object({
      title: z.string().min(1, "conventions.title 不能为空"),
      items: z.array(z.string().min(1)).min(1, "conventions.items 至少一条"),
    }),
    fallback: z.object({
      meta: z.string().min(1, "fallback.meta 不能为空"),
      description: z.string().min(1, "fallback.description 不能为空"),
    }),
  }),

  overview: z.object({
    seo: seoSchema,
    header: headerSchema,
    badges: z.array(badgeSchema).min(1, "badges 至少一个"),
    intro: z.string().min(1, "intro 不能为空"),
    choices: z
      .array(
        z.object({
          name: z.string().min(1, "choices.name 不能为空"),
          href: z.string().min(1, "choices.href 不能为空"),
          description: z.string().min(1, "choices.description 不能为空"),
        }),
      )
      .min(1, "choices 至少一项"),
    gettingStarted: textListSchema,
    resources: z.object({
      title: z.string().min(1, "resources.title 不能为空"),
      description: z.string().min(1, "resources.description 不能为空"),
      items: z.array(linkItemSchema).min(1, "resources.items 至少一条"),
    }),
    specs: z.object({
      title: z.string().min(1, "specs.title 不能为空"),
      description: z.string().min(1, "specs.description 不能为空"),
      items: z.array(linkItemSchema).min(1, "specs.items 至少一条"),
    }),
    troubleshooting: z.object({
      title: z.string().min(1, "troubleshooting.title 不能为空"),
      description: z.string().min(1, "troubleshooting.description 不能为空"),
      items: z.array(labeledTextSchema).min(1, "troubleshooting.items 至少一条"),
    }),
  }),

  api: z.object({
    seo: seoSchema,
    header: headerSchema,
    badges: z.array(badgeSchema).min(1, "badges 至少一个"),
    intro: z.string().min(1, "intro 不能为空"),
    convention: z.object({
      title: z.string().min(1, "convention.title 不能为空"),
      badges: z.array(badgeSchema).min(1, "convention.badges 至少一个"),
      description: z.string().min(1, "convention.description 不能为空"),
    }),
    quickstart: z.object({
      title: z.string().min(1, "quickstart.title 不能为空"),
      description: z.string().min(1, "quickstart.description 不能为空"),
      codeLabel: z.string().min(1, "quickstart.codeLabel 不能为空"),
      code: z.string().min(1, "quickstart.code 不能为空"),
    }),
    commonUrls: z.object({
      title: z.string().min(1, "commonUrls.title 不能为空"),
      description: z.string().min(1, "commonUrls.description 不能为空"),
      items: z.array(z.tuple([z.string(), z.string()])).min(1, "commonUrls.items 至少一条"),
    }),
    themeCapsules: z.object({
      title: z.string().min(1, "themeCapsules.title 不能为空"),
      description: z.string().min(1, "themeCapsules.description 不能为空"),
      columns: z.array(z.string().min(1)).length(3, "themeCapsules.columns 需要 3 列"),
      rows: z.array(z.tuple([z.string(), z.string(), z.string()])).min(1, "themeCapsules.rows 至少一行"),
    }),
    direct: z.object({
      title: z.string().min(1, "direct.title 不能为空"),
      description: z.string().min(1, "direct.description 不能为空"),
      columns: z.array(z.string().min(1)).length(2, "direct.columns 需要 2 列"),
      rows: z.array(z.tuple([z.string(), z.string()])).min(1, "direct.rows 至少一行"),
      note: z.string().min(1, "direct.note 不能为空"),
    }),
    endpoints: z.object({
      title: z.string().min(1, "endpoints.title 不能为空"),
      description: z.string().min(1, "endpoints.description 不能为空"),
      columns: z.array(z.string().min(1)).length(4, "endpoints.columns 需要 4 列"),
      groups: z
        .array(
          z.object({
            id: z.string().min(1, "endpoints.groups.id 不能为空"),
            title: z.string().min(1, "endpoints.groups.title 不能为空"),
            description: z.string().min(1, "endpoints.groups.description 不能为空"),
            tone: z.enum(["sky", "indigo", "violet", "emerald", "amber"]),
            rows: z
              .array(z.tuple([z.string(), z.string(), z.string(), z.string()]))
              .min(1, "endpoints.groups.rows 至少一行"),
          }),
        )
        .min(1, "endpoints.groups 至少一组"),
      note: z.string().min(1, "endpoints.note 不能为空"),
    }),
    params: z.object({
      title: z.string().min(1, "params.title 不能为空"),
      description: z.string().min(1, "params.description 不能为空"),
      columns: z.array(z.string().min(1)).length(4, "params.columns 需要 4 列"),
      groups: z
        .array(
          z.object({
            title: z.string().min(1, "params.groups.title 不能为空"),
            description: z.string().min(1, "params.groups.description 不能为空"),
            rows: z
              .array(z.tuple([z.string(), z.string(), z.string(), z.string()]))
              .min(1, "params.groups.rows 至少一行"),
          }),
        )
        .min(1, "params.groups 至少一组"),
      notes: z.array(z.string().min(1)).min(1, "params.notes 至少一条"),
    }),
    fields: z.object({
      title: z.string().min(1, "fields.title 不能为空"),
      description: z.string().min(1, "fields.description 不能为空"),
      columns: z.array(z.string().min(1)).length(4, "fields.columns 需要 4 列"),
      rows: z.array(z.tuple([z.string(), z.string(), z.string(), z.string()])).min(1, "fields.rows 至少一行"),
      excluded: z.object({
        title: z.string().min(1, "fields.excluded.title 不能为空"),
        items: z.array(z.string().min(1)).min(1, "fields.excluded.items 至少一条"),
        note: z.string().min(1, "fields.excluded.note 不能为空"),
      }),
      exampleLabel: z.string().min(1, "fields.exampleLabel 不能为空"),
      example: z.string().min(1, "fields.example 不能为空"),
    }),
    scenarios: z.object({
      title: z.string().min(1, "scenarios.title 不能为空"),
      description: z.string().min(1, "scenarios.description 不能为空"),
      items: z
        .array(
          z.object({
            step: z.string().min(1, "scenarios.items.step 不能为空"),
            title: z.string().min(1, "scenarios.items.title 不能为空"),
            description: z.string().min(1, "scenarios.items.description 不能为空"),
          }),
        )
        .min(1, "scenarios.items 至少一条"),
      paginationLabel: z.string().min(1, "scenarios.paginationLabel 不能为空"),
      paginationCodeLabel: z.string().min(1, "scenarios.paginationCodeLabel 不能为空"),
      paginationCode: z.string().min(1, "scenarios.paginationCode 不能为空"),
      note: z.string().min(1, "scenarios.note 不能为空"),
    }),
    rateLimit: z.object({
      title: z.string().min(1, "rateLimit.title 不能为空"),
      description: z.string().min(1, "rateLimit.description 不能为空"),
      tiers: z.object({
        title: z.string().min(1, "rateLimit.tiers.title 不能为空"),
        columns: z.array(z.string().min(1)).length(4, "rateLimit.tiers.columns 需要 4 列"),
        rows: z.array(z.tuple([z.string(), z.string(), z.string(), z.string()])).min(1, "rateLimit.tiers.rows 至少一行"),
      }),
      headers: z.object({
        title: z.string().min(1, "rateLimit.headers.title 不能为空"),
        columns: z.array(z.string().min(1)).length(3, "rateLimit.headers.columns 需要 3 列"),
        rows: z.array(z.tuple([z.string(), z.string(), z.string()])).min(1, "rateLimit.headers.rows 至少一行"),
      }),
      notes: z.array(z.string().min(1)).min(1, "rateLimit.notes 至少一条"),
      exampleLabel: z.string().min(1, "rateLimit.exampleLabel 不能为空"),
      example: z.string().min(1, "rateLimit.example 不能为空"),
    }),
    specs: z.object({
      title: z.string().min(1, "specs.title 不能为空"),
      items: z.array(linkItemSchema).min(1, "specs.items 至少一条"),
    }),
    troubleshooting: z.object({
      title: z.string().min(1, "troubleshooting.title 不能为空"),
      items: z.array(labeledTextSchema).min(1, "troubleshooting.items 至少一条"),
    }),
  }),

  mcp: z.object({
    seo: seoSchema,
    header: headerSchema,
    badges: z.array(badgeSchema).min(1, "badges 至少一个"),
    intro: z.string().min(1, "intro 不能为空"),
    setup: z.object({
      title: z.string().min(1, "setup.title 不能为空"),
      badge: z.string().min(1, "setup.badge 不能为空"),
      endpoint: z.object({
        title: z.string().min(1, "setup.endpoint.title 不能为空"),
        code: z.string().min(1, "setup.endpoint.code 不能为空"),
        note: z.string().min(1, "setup.endpoint.note 不能为空"),
      }),
      clients: z.object({
        title: z.string().min(1, "setup.clients.title 不能为空"),
      }),
      prompt: z.object({
        title: z.string().min(1, "setup.prompt.title 不能为空"),
        text: z.string().min(1, "setup.prompt.text 不能为空"),
        note: z.string().min(1, "setup.prompt.note 不能为空"),
      }),
    }),
    tools: z.object({
      title: z.string().min(1, "tools.title 不能为空"),
      description: z.string().min(1, "tools.description 不能为空"),
      items: z
        .array(
          z.object({
            name: z.string().min(1, "tools.items.name 不能为空"),
            description: z.string().min(1, "tools.items.description 不能为空"),
            args: z.string().min(1, "tools.items.args 不能为空"),
          }),
        )
        .min(1, "tools.items 至少一个"),
    }),
    returns: z.object({
      title: z.string().min(1, "returns.title 不能为空"),
      description: z.string().min(1, "returns.description 不能为空"),
    }),
    spec: z.object({
      title: z.string().min(1, "spec.title 不能为空"),
      description: z.string().min(1, "spec.description 不能为空"),
    }),
    troubleshooting: z.object({
      title: z.string().min(1, "troubleshooting.title 不能为空"),
      items: z.array(labeledTextSchema).min(1, "troubleshooting.items 至少一条"),
    }),
    alternatives: z.object({
      title: z.string().min(1, "alternatives.title 不能为空"),
      items: z.array(z.string().min(1)).min(1, "alternatives.items 至少一条"),
    }),
  }),

  rss: z.object({
    seo: seoSchema,
    header: headerSchema,
    badges: z.array(badgeSchema).min(1, "badges 至少一个"),
    intro: z.string().min(1, "intro 不能为空"),
    feeds: z.object({
      title: z.string().min(1, "feeds.title 不能为空"),
      description: z.string().min(1, "feeds.description 不能为空"),
      items: z
        .array(
          z.object({
            label: z.string().min(1, "feeds.items.label 不能为空"),
            path: z.string().min(1, "feeds.items.path 不能为空"),
            description: z.string().min(1, "feeds.items.description 不能为空"),
          }),
        )
        .min(1, "feeds.items 至少一条"),
      note: z.string().min(1, "feeds.note 不能为空"),
    }),
    itemFields: z.object({
      title: z.string().min(1, "itemFields.title 不能为空"),
      items: z
        .array(
          z.object({
            name: z.string().min(1, "itemFields.items.name 不能为空"),
            description: z.string().min(1, "itemFields.items.description 不能为空"),
          }),
        )
        .min(1, "itemFields.items 至少一条"),
      sample: z.string().min(1, "itemFields.sample 不能为空"),
    }),
    updates: z.object({
      title: z.string().min(1, "updates.title 不能为空"),
      items: z.array(z.string().min(1)).min(1, "updates.items 至少一条"),
    }),
  }),

  skill: z.object({
    seo: seoSchema,
    header: headerSchema,
    badges: z.array(badgeSchema).min(1, "badges 至少一个"),
    intro: z.string().min(1, "intro 不能为空"),
    steps: z.object({
      title: z.string().min(1, "steps.title 不能为空"),
      prompt: z.object({
        title: z.string().min(1, "steps.prompt.title 不能为空"),
        note: z.string().min(1, "steps.prompt.note 不能为空"),
        codeLabel: z.string().min(1, "steps.prompt.codeLabel 不能为空"),
        code: z.string().min(1, "steps.prompt.code 不能为空"),
      }),
      newSession: z.object({
        title: z.string().min(1, "steps.newSession.title 不能为空"),
        note: z.string().min(1, "steps.newSession.note 不能为空"),
      }),
      ask: z.object({
        title: z.string().min(1, "steps.ask.title 不能为空"),
        text: z.string().min(1, "steps.ask.text 不能为空"),
        note: z.string().min(1, "steps.ask.note 不能为空"),
      }),
    }),
    prompts: z.object({
      title: z.string().min(1, "prompts.title 不能为空"),
      description: z.string().min(1, "prompts.description 不能为空"),
      items: z.array(z.string().min(1)).min(1, "prompts.items 至少一条"),
    }),
    manual: z.object({
      title: z.string().min(1, "manual.title 不能为空"),
      description: z.string().min(1, "manual.description 不能为空"),
      entries: z
        .array(
          z.object({
            label: z.string().min(1, "manual.entries.label 不能为空"),
            codeLabel: z.string().min(1, "manual.entries.codeLabel 不能为空"),
            code: z.string().min(1, "manual.entries.code 不能为空"),
          }),
        )
        .min(1, "manual.entries 至少一条"),
      footnote: z.string().min(1, "manual.footnote 不能为空"),
    }),
    troubleshooting: z.object({
      title: z.string().min(1, "troubleshooting.title 不能为空"),
      items: z.array(labeledTextSchema).min(1, "troubleshooting.items 至少一条"),
    }),
    alternatives: z.object({
      title: z.string().min(1, "alternatives.title 不能为空"),
      items: z.array(z.string().min(1)).min(1, "alternatives.items 至少一条"),
      note: z.string().min(1, "alternatives.note 不能为空"),
    }),
  }),
});
