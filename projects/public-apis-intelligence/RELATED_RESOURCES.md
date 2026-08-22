# 关联资源生态研究

本项目最初回答“有哪些公共 API、适合什么场景”。扩展研究表明，真实产品落地通常还需要数据集、机器可读接口规范、开源产品、AI 工具适配和托管基础设施。因此这些仓库不是互相替代，而是同一条交付链上的不同层次。

```text
具体需求
  → 公共 API / 数据集发现
  → OpenAPI 路径、参数与返回模型
  → 开源产品或 MCP 工具封装
  → 托管、数据库、监控与安全
  → 真实验证、统一适配和产品交付
```

结构化清单位于 [`data/research/related-resource-libraries.json`](data/research/related-resource-libraries.json)。当前共收录 15 个高价值来源，统一记录资源层次、资产类型、与 public-apis 的关系、目录格式、变化速度、优先级、产品机会和验证边界。

## 五个推荐子项目

| 优先级 | 子项目 | 主要来源 | 解决的问题 |
| --- | --- | --- | --- |
| 1 | OpenAPI Intelligence | APIs.guru OpenAPI Directory | 从“找到 API”推进到解析路径、参数、请求体和返回模型，并生成适配器、SDK 或 Mock |
| 2 | Open Data Intelligence | Awesome Public Datasets、Awesome Datasets | 从“找到数据”推进到许可证、规模、地区、时间、格式和获取成本判断 |
| 3 | MCP Intelligence | Awesome MCP Servers | 盘点 AI Agent 可调用工具，并评估安装、权限、密钥、数据外传和维护风险 |
| 4 | Open-source Product Intelligence | Awesome Self-hosted、Awesome Sysadmin | 判断产品需求是否已有可部署开源实现，以及部署和二开成本 |
| 5 | Agriculture & Ecology Intelligence | Open Sustainable Technology、Awesome Agriculture、Open Source Agriculture | 把农业 API 扩展到数据集、模型、遥感、软硬件、植物、动物和生物多样性工具 |

## 关联规则

未来合并多个目录时，不能只按名称去重。建议为资源建立统一实体，并保留以下关联键：

- 规范化名称与别名；
- 服务域名和 API 基础地址；
- GitHub 仓库与官方文档 URL；
- OpenAPI `x-providerName`、服务名和规范来源；
- 数据集发布方、许可证和下载地址；
- MCP Server 底层依赖的 API、数据库或本地能力；
- 开源产品提供或消费的 API、数据集和部署组件。

同一个实体可以同时具有多种角色。例如一个物种数据平台可能同时提供批量数据集、REST API、OpenAPI 规范、Python 客户端和 MCP 工具。统一资源图谱应保留这些角色，而不是把它们误认为五个互不相关的资源。

## 验证边界

本次只完成仓库 README 与公开说明层面的资源研究，没有安装全部项目、调用全部 API 或下载全部数据集。后续使用时仍需逐项核验：

- 仓库和链接是否仍然维护；
- API、MCP 或数据下载是否真实可用；
- 认证、配额、价格、限流和地区限制；
- 软件依赖、权限范围、供应链和数据外传风险；
- 数据许可证、隐私、署名、再分发和商业使用条件；
- 数据覆盖范围、更新时间、偏差和产品适用性。

因此，相关资源清单继续承担“发现与调度入口”，不作为生产质量认证。
