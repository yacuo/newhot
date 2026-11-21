---
title: "示例数据：Mistral Orbit 2.0 正式上线，支持文本与图像混合输入并公布每百万 Token 示例价格"
slug: sample-orbit-2-0
description: "这是一篇用于演示站点结构的示例文章。示例模型 Mistral Orbit 2.0 正式上线，支持文本与图像混合输入，官方称单次请求最多携带 16 张图片，示例价格为每百万 Token 3 美元。文中产品、版本与数字均为虚构，仅用于展示页面排版与结构化数据。"
date: 2026-11-12
publishedAt: "2026-11-12"
category: llm
subcategory: release
type: release
company: anthropic
author: "NewHot 编辑部"
tags: ["Mistral", "示例数据", "多模态", "Orbit 2.0"]
sources:
  - title: "示例官方上线公告"
    url: "https://example.com/orbit-2-0"
faqs:
  - question: "Orbit 2.0 支持哪些输入类型？"
    answer: "示例数据写了文本与图像。"
  - question: "Orbit 2.0 一次能上传多少张图？"
    answer: "示例数据写的是 16 张。"
  - question: "Orbit 2.0 的示例价格是多少？"
    answer: "示例数据写的是每百万 Token 3 美元。"
glossary:
  - term: "多模态输入"
    definition: "同一次请求里同时包含文本与图片等不同格式。"
  - term: "图像编码"
    definition: "把图片转换成模型可以读取的向量表示。"
  - term: "每百万 Token 价格"
    definition: "按处理量计费时使用的统一计价单位。"
---

本文为站点示例数据，产品、版本与数字均为虚构，仅用于演示页面结构。

示例模型 Mistral Orbit 2.0 的主要变化是图像输入。官方原文称：“Orbit 2.0 单次请求最多接受 16 张图片，并与文本一起参与推理。”（来源：[示例官方上线公告](https://example.com/orbit-2-0)）

## Orbit 2.0 支持哪些输入类型？

Orbit 2.0 同时接受文本与图片，图片会先经过编码再进入推理流程。

官方称图文混合输入适合票据识别、界面截图理解和多页文档比对三类场景。（来源：[示例官方上线公告](https://example.com/orbit-2-0)）

### 图片支持哪些格式？

示例数据写了常见位图格式，矢量图需要先转成位图再上传。

### 图文混合有什么限制？

文本与图片共享同一个上下文窗口，图片会按面积折算成 Token。

## Orbit 2.0 一次能处理多少张图片？

单次请求最多 16 张图片，超过上限时需要拆成多次请求。

这条限制来自示例数据，真实产品请以官方文档为准。延伸阅读：[示例文章 A](/release/sample-nova-1-0/) 与 [示例文章 C](/release/sample-lumen-3-0/)。

### 图片尺寸会影响价格吗？

会，图片面积越大折算的 Token 越多，价格按总量计算。

### 多页文档怎么上传？

示例数据建议按页拆分后分批上传，避免单次请求超过图片数量上限。

## Orbit 2.0 怎么计费？

示例价格为每百万 Token 3 美元，图片按折算后的 Token 计入总量。

如果你在看模板结构，可以继续查看 [示例文章 A](/release/sample-nova-1-0/) 或 [示例文章 C](/release/sample-lumen-3-0/)。

### 有最低消费吗？

示例数据写的是按实际用量结算，没有固定月费。

### 可以按量封顶吗？

示例数据称企业版可以设置每日预算上限，超过后自动停止调用。
