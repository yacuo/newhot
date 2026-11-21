---
title: "示例数据：Mistral Nova 1.0 正式发布，面向长文档的轻量推理模型把首字节延迟降低 40%"
slug: sample-nova-1-0
description: "这是一篇用于演示站点结构的示例文章。示例模型 Mistral Nova 1.0 正式发布，主打长文档推理，官方称 20 万 Token 上下文下首字节延迟降低 40%，并开放轻量版权重供本地测试。文中产品、版本与数字均为虚构，仅用于展示页面排版与结构化数据。"
date: 2026-11-10
publishedAt: "2026-11-10"
category: llm
subcategory: release
type: release
company: openai
author: "NewHot 编辑部"
tags: ["Mistral", "示例数据", "长文档", "Nova 1.0"]
sources:
  - title: "示例官方发布页"
    url: "https://example.com/nova-1-0"
faqs:
  - question: "Nova 1.0 的上下文窗口有多大？"
    answer: "示例数据写的是 20 万 Token。"
  - question: "Nova 1.0 现在可以直接使用吗？"
    answer: "示例数据称已开放公测，可申请 API。"
  - question: "Nova 1.0 会开源模型权重吗？"
    answer: "示例数据称轻量版权重会开放。"
glossary:
  - term: "上下文窗口"
    definition: "模型一次能够读取的最大 Token 数量。"
  - term: "推理延迟"
    definition: "从请求发出到收到完整响应的时间。"
  - term: "轻量版权重"
    definition: "参数量较小、可在本地运行的模型文件。"
---

本文为站点示例数据，产品、版本与数字均为虚构，仅用于演示页面结构。

示例模型 Mistral Nova 1.0 的核心变化是长文档处理。官方原文称：“Nova 1.0 在 20 万 Token 上下文下，将首字节延迟降低了 40%。”（来源：[示例官方发布页](https://example.com/nova-1-0)）

## Nova 1.0 的上下文窗口有多大？

Nova 1.0 支持 20 万 Token 上下文，可以一次读入约 300 页中文文档。

官方称长文档问答不再需要分段摘要，输入完整合同即可直接提问。（来源：[示例官方发布页](https://example.com/nova-1-0)）

### 上下文窗口如何计费？

上下文窗口按输入与输出 Token 总量计费，超出上限的部分需要拆成多次请求。

### 超长文档怎么处理？

超过 20 万 Token 时，官方建议先按章节切分，再用摘要节点合并结果。

## Nova 1.0 的延迟降低了多少？

Nova 1.0 的官方数字是首字节延迟降低 40%，测试条件为 20 万 Token 输入与 2 万 Token 输出。

这组数字来自示例数据，不代表任何真实产品。相关阅读：[示例文章 B](/release/sample-orbit-2-0/) 与 [示例文章 C](/release/sample-lumen-3-0/)。

### 延迟测试用了什么硬件？

示例数据没有披露硬件型号，只说明在同机同网络条件下对比上一代模型。

### 和上一代模型相比呢？

上一代模型在同样输入下需要更长时间完成首字节响应，差距主要来自长上下文调度。

## Nova 1.0 现在能直接用吗？

示例数据写的是发布当天开放公测，个人开发者可以申请 API Key。

如果只想看页面结构，可以继续浏览 [示例文章 B](/release/sample-orbit-2-0/) 或 [示例文章 C](/release/sample-lumen-3-0/)。

### 有免费额度吗？

示例数据写了每月一定的免费 Token 额度，超出后按量计费。

### 企业版怎么计费？

企业版按 Token 用量结算，支持预留吞吐与独立部署两种方式。
