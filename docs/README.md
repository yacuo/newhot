# NewHot 文档

面向 AI 编码代理。只写当前事实和可执行步骤，不写背景、历史、方案对比和未来规划。

仓库根目录的 [README](../README.md) 是总入口：修改前先按 README 里的阅读顺序过一遍，再回到这里查权威源。

## 文档索引

| 文件 | 内容 | 什么时候读 |
| --- | --- | --- |
| [架构与运行.md](./架构与运行.md) | 运行形态、技术栈、目录、构建、命令、环境变量、上线守卫 | 了解系统、改构建、上线 |
| [页面与路由.md](./页面与路由.md) | 路由、静态导出、数据读取、组件分层、SEO、搜索/feed 产物、样式 | 改页面、加路由、调 UI |
| [内容模型与规范.md](./内容模型与规范.md) | 频道、分类、类型、frontmatter、正文、SEO、校验 | 新增频道/分类、写文章、审稿 |

## 权威源

代码与配置优先于文档，冲突时以下列文件为准。

| 主题 | 文件 |
| --- | --- |
| 频道配置 | `data/channels/<channel>/channel.json` |
| 分类配置（label/description/seo/order） | `data/channels/<channel>/<subcategory>/subcategory.json` |
| 内容类型与默认值 | `config/global/content-types.json` |
| frontmatter 字段 | `src/entities/article/model/schema.ts` |
| 公司实体与产品别名 | `data/vendors/companies.json` |
| 主题、分组与公司归属 | `data/vendors/themes.json` |
| 公司发展史节点 | `data/vendors/history/<companyId>.json` |
| 发展史水位 | `data/vendors/history-state.json` |
| 提交与协作规范 | `CONTRIBUTING.md` |
| npm 命令 | `package.json` |

## 文档规则

1. 改架构、目录、命令、配置、校验规则时必须同步改对应文档，同一次提交完成。
2. 不新增“调研”“方案”“规划”“拆解”类文档；结论直接写进上面的文档。
3. 代码和配置能推导的内容不重复写：目录清单、组件清单、运维步骤、台账、字段全集都不抄，只写约定、阈值、判定条件和权威源。
4. 不复制代码细节，写给 AI 看的路径、命令、字段和判定条件。
