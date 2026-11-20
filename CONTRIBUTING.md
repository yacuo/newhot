# 贡献指南

感谢参与 NewHot。提 Issue 或 PR 前请先读一遍这份文档，能省掉大部分来回沟通。

## 环境要求

- Node.js 20 或更高版本（推荐 22，见 `.nvmrc`）
- npm

```bash
npm ci
npm run dev
```

`npm run dev` 会先生成图标与列表数据，再启动开发服务。

## 提 Issue

- 先搜索已有 Issue，避免重复
- 使用仓库的 Issue 模板，不要空白提交
- Bug 必须写清楚：现象、复现步骤、期望结果、Node 版本；能附日志或截图更好
- 功能建议说明要解决的问题和使用场景，而不是只给结论
- 安全问题不要公开提，按 [SECURITY.md](SECURITY.md) 的渠道私下报告

## 分支命名

从 `main` 切分支，用 `类型/简短说明`：

```text
feat/channel-ai-hardware
fix/tutorial-sidebar-width
docs/contributing
chore/update-deps
```

## 提交信息

统一使用 `type(scope): 说明`，中间用英文冒号加空格。仓库根目录有 `.gitmessage` 模板，建议开启：

```bash
git config commit.template .gitmessage
```

类型：

| type | 用途 |
| --- | --- |
| `feat` | 新功能、新页面、新内容能力 |
| `fix` | 修复错误 |
| `docs` | 只改文档 |
| `refactor` | 重构，不改变行为 |
| `style` | 格式调整，不影响逻辑 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `build` / `ci` | 构建、依赖、CI 配置 |
| `chore` | 杂项维护 |
| `revert` | 回滚提交 |

示例：

```text
feat(themes): 公司卡片支持按分类筛选
fix(tutorial): 侧边栏在窄屏下宽度溢出
docs(contributing): 补充提交信息规范
chore(deps): 升级 astro 到 7.4.12
```

scope 用受影响的模块或目录，如 `themes`、`tutorial`、`content`、`search`、`deps`。破坏性变更在提交正文里单独写 `BREAKING CHANGE: ...`。

一个提交只做一件事；不要把内容改动和代码改动混在一起。

## 改代码前

- 页面、组件、数据读取的约定见 [docs/页面与路由.md](docs/页面与路由.md)
- 构建、命令、环境变量见 [docs/架构与运行.md](docs/架构与运行.md)
- 内容结构、frontmatter 与正文格式见 [docs/内容模型与规范.md](docs/内容模型与规范.md)

代码约定：

- 2 空格缩进、LF 换行，遵循 `.editorconfig`
- TypeScript strict，不写 `any`
- 样式只用 `src/styles/global.css` 的 token，不新增任意色值和字号
- 交互脚本放在 `src/scripts/`，通过 `data-*` 属性取数据

## 改内容前

- 文章放在 `data/channels/<channel>/<subcategory>/posts/`
- 频道与分类配置在同级的 `channel.json`、`subcategory.json`
- 新增频道或分类时，按内容规范里的 SOP 同步 `content-types.json`
- 示例内容请保留“示例”标注，方便使用模板的人区分

## 提交前自检

```bash
npm run check           # Astro 类型检查
npm run build           # 完整构建
npm run check:budget    # 检查 HTML/CSS/JS 体积预算
```

CI 会跑同样的命令，本地通过基本就不会卡在 CI。提交信息也会在 PR 里自动检查格式。

## 不要提交

- `.env` 及任何密钥
- `dist/`、`public/data/`、`.astro/`、`.tmp/`
- 与本次改动无关的格式化噪音

## 提交 PR

- 标题与提交信息同格式，如 `fix(tutorial): 侧边栏宽度`
- 描述写清楚：改了什么、为什么改、怎么验证的
- 一个 PR 只做一件事，方便 review 和回滚
- 涉及页面改动时附截图
- 按 PR 模板勾选自检项

## 协议

提交代码即表示同意以仓库的 [LICENSE](LICENSE) 发布，并保留站点与仓库的可见署名。
