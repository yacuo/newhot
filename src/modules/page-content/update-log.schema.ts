import { z } from "zod";

/**
 * 更新日志条目（`data/update-log/posts/{slug}.md` 的 frontmatter）的固定格式。
 *
 * 用 strictObject：字段写错、多写字段、拼写错误都会直接失败，避免 AI 自由发挥。
 * 修改规则时只改这一处，页面加载与构建前校验共用。
 */
const changeItemSchema = z
  .string()
  .trim()
  .min(4, "变更条目至少 4 个字")
  .max(120, "变更条目不超过 120 个字");

export const updateLogEntrySchema = z
  .strictObject({
    /** 发布日，YYYY-MM-DD */
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "date 必须是 YYYY-MM-DD")
      .refine((value) => !Number.isNaN(Date.parse(value)), "date 不是有效日期"),
    /** 发布时间，24 小时制 HH:mm */
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "time 必须是 HH:mm，例如 09:30"),
    title: z.string().trim().min(4, "title 至少 4 个字").max(80, "title 不超过 80 个字"),
    summary: z.string().trim().min(20, "summary 至少 20 个字").max(200, "summary 不超过 200 个字"),
    tags: z.array(z.string().trim().min(1).max(20)).min(1, "tags 至少 1 个").max(5, "tags 最多 5 个").default([]),
    added: z.array(changeItemSchema).default([]),
    improved: z.array(changeItemSchema).default([]),
    fixed: z.array(changeItemSchema).default([]),
    /** 占位记录会在页面上标出来，方便后续替换成真实发布内容 */
    placeholder: z.boolean().optional(),
  })
  .refine((entry) => entry.added.length + entry.improved.length + entry.fixed.length > 0, {
    message: "added / improved / fixed 至少要写一条",
    path: ["added"],
  });

export type UpdateLogEntryMeta = z.infer<typeof updateLogEntrySchema>;
