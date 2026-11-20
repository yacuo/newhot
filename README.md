# NewHot

面向 AI 使用者的资讯与技术内容站，持续跟踪大模型、AI 智能体、AI 编程、AI 办公、AI 创作和 AI 硬件等方向。

- 站点：https://newhot.org
- 仓库：https://github.com/yacuo/newhot

## 技术栈

- 本站使用 Astro 7 + Tailwind CSS v4 搭建，线上站点：https://newhot.org
- Astro + TypeScript
- Tailwind CSS v4
- Markdown + Frontmatter 内容管理
- Zod 构建期校验
- 静态输出（`output: "static"`，产物 `dist/`），可部署到任意静态托管平台

## 目录结构

```text
src/pages/       路由
src/layouts/     页面骨架
src/components/  展示组件
src/modules/     业务模块：content、channel、vendor、tutorial、page-content
src/shared/      跨模块能力：seo、ui、site、utils
src/config/      界面与站点配置
src/schema/      内容类型枚举
src/scripts/     客户端脚本
src/styles/      样式
data/            内容源：页面 JSON、频道文章、教程
scripts/         构建期数据生成与预算检查
ops/             本地启停脚本
public/data/     构建期生成的数据
```

仓库内的 `data/` 带有虚构的示例文章与示例教程，clone 后 `npm run dev` 就能看到完整页面。想用自己的内容时，通过 `CONTENT_DIR` 指向自己的内容目录。

## 快速开始

要求 Node.js 20+（推荐 22）。

```bash
npm install
npm run dev        # 生成数据 + Astro 开发服务
npm run build      # 生成数据 + 静态输出到 dist/
npm run check      # Astro 类型检查
npm run check:budget  # 检查 HTML/CSS/JS 体积预算
```

仓库内 `data/` 可直接运行。需要读取外部内容目录时：

```bash
CONTENT_DIR=../my-content npm run dev
```

## 文档

| 文档 | 内容 |
| --- | --- |
| [文档索引](docs/README.md) | 权威源与文档规则 |
| [架构与运行](docs/架构与运行.md) | 技术栈、目录、路由、构建、环境变量 |
| [页面与路由](docs/页面与路由.md) | 路由、数据读取、组件分层、样式 |
| [内容模型与规范](docs/内容模型与规范.md) | 频道、分类、frontmatter、正文与格式 |

写文章放在 `data/channels/{channel}/{subcategory}/posts/` 下，频道与分类的配置在同级的 `channel.json` 与 `subcategory.json`，字段与结构见[内容模型与规范](docs/内容模型与规范.md)。

## 数据生成

- `scripts/generate-article-feeds.ts`：生成 `public/data/feed/home.json`（首页置顶 + 各层级首批）与 `meta.json`（频道/分类/公司统计）
- `scripts/generate-article-lists.ts`：按频道、分类、首页层级、公司生成 `public/data/lists/<scope>/<n>.json`，每片 50 条，供列表滚动与搜索按需加载

两个脚本都在 `dev` 与 `build` 前自动执行。

## 部署

构建产物是纯静态的 `dist/`，可以上传到任意静态托管平台。

## 开发与贡献

### 先读什么

不论是人还是 AI 代理，改这个仓库前按顺序读：

1. [文档索引](docs/README.md)：权威源与文档规则
2. [架构与运行](docs/架构与运行.md)：技术栈、目录、构建命令、环境变量
3. [页面与路由](docs/页面与路由.md)：路由、数据读取、组件分层、样式
4. [内容模型与规范](docs/内容模型与规范.md)：频道、分类、frontmatter、教程、更新日志
5. [CONTRIBUTING.md](./CONTRIBUTING.md)：分支命名、提交信息、Issue 与 PR 规范

给 AI 代理的约定：代码与配置优先于文档；改页面先看 `src/pages` 和对应 `data/` 配置；不要手改 `public/data/`、`public/llms.txt`、`dist/` 这些生成产物。

### 提交与 Issue

- 提交信息统一 `type(scope): 说明`，类型见 CONTRIBUTING；PR 会跑 commitlint 校验
- 本地开启提交模板：`git config commit.template .gitmessage`
- Bug 必须使用 Issue 模板，写清复现步骤与环境；安全问题按 [SECURITY.md](./SECURITY.md) 私下报告
- 一个 PR 只做一件事，涉及页面改动附截图
- 行为准则见 [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)，版本记录见 [CHANGELOG.md](./CHANGELOG.md)

### 提交前自检

```bash
npm run check           # Astro 类型检查
npm run build           # 完整构建
npm run check:budget    # HTML/CSS/JS 体积预算
```

CI 会执行同样的命令。

## 使用与署名

本项目采用 [NewHot Attribution License 1.0](./LICENSE)：可以修改源码、部署成自己的站点，但必须保留两处可见署名：

- 本站地址：https://newhot.org
- 开源仓库地址：https://github.com/yacuo/newhot

模板已经在页脚内置「NewHot 主站」与「模板来自 NewHot」，可以调整样式，但不能删除、隐藏或放到用户看不到的位置。使用本站模板即视为同意该协议。

## Copyright

代码与仓库内示例内容采用 [NewHot Attribution License 1.0](./LICENSE)。NewHot 线上站点的真实文章与图片不包含在本仓库，版权归 NewHot 所有，详见 [CONTENT_LICENSE.md](./CONTENT_LICENSE.md)。
