# Public APIs Intelligence：公共 API 能力账本

> 获取 `public-apis/public-apis` 的真实目录快照，把手工维护的 Markdown 资源表转成可检索、可统计、可解释的 API 资产数据，并以可追溯方式补充官方农业 API。

## 元信息

| 字段 | 内容 |
| --- | --- |
| 状态 | `archived`（阶段性归档，后期按实际需求调度） |
| 原项目 | <https://github.com/public-apis/public-apis> |
| 上游版本 | `c045a2eb505f0f8b7992bb4af53cc020f25003fd`（2026-08-19） |
| 开始日期 | 2026-08-22 |
| 在线演示 | [公共 API 能力账本](https://yydshly.github.io/0821_githubcode_study/demos/public-apis-intelligence/) |
| 上游许可证 | MIT |

阶段性结论与重新启用条件见 [`ARCHIVE.md`](ARCHIVE.md)。当前保留演示、数据和同步能力，但不继续执行第三方 API 真实调用验证。

## 已实现能力

- 固定保存上游 README、提交 SHA、抓取时间和许可证信息；
- 解析 1,695 个上游 API 条目与 51 个原始分类，另收录 12 个经官方文档复核的农业扩展源；
- 把组合目录归并为 11 个能力领域与 52 个分类，并始终分开标注上游与扩展来源；
- 在领域与分类之下建立 311 条细分场景定义，并为当前目录生成 324 个有候选 API 的场景入口；
- 农业领域细分为农业气象、土壤、产量、畜牧、市场价格、病虫害、植物识别、遥感、粮食安全和农业报告 10 类任务；
- 支持从“天气预报、股票行情、IP 定位、新闻聚合”等具体任务反查候选 API、典型产品和选型重点；
- 为全部 52 个组合分类建立“具体数据对象、通常输入、常见返回字段、可回答问题”资料卡；领域只作为内部导航；
- 能直接搜索数据或字段，例如“法定节假日、预算金额、人口统计、专利法律状态、降水概率”；
- 导出 JSON、CSV 和聚合统计摘要；
- 根据 HTTPS、CORS、认证、文档链接和描述完整度计算“目录接入准备度”；
- 推断浏览器直连、后端代理、OAuth 集成、仅研究/寻找替代四种接入方式；
- 为每条记录生成可解释的风险和下一步建议；
- 提供搜索、组合筛选、排序、详情、CSV 下载、深浅主题与响应式演示。

## 当前全量统计

| 指标 | 数量 | 解释 |
| --- | ---: | --- |
| API 条目 | 1,707 | 1,695 个上游条目 + 12 个农业官方扩展 |
| 分类 / 领域 | 52 / 11 | 51 个上游分类 + 1 个农业扩展分类 |
| 已填充细分场景 | 324 | 当前至少匹配到 1 个目录候选的任务场景 |
| 明确场景匹配 | 1,141 | 根据 API 名称与目录描述命中具体场景 |
| 待人工细分 | 566 | 上游描述不足，保留在分类“综合能力”兜底项 |
| HTTPS = Yes | 1,615 | 目录或官方文档声明支持 HTTPS |
| CORS 状态已知 | 715 | Yes 或 No；其余 992 条仍为 Unknown |
| 浏览器直连候选 | 311 | HTTPS Yes、Auth No、CORS Yes 同时成立 |
| 建议后端代理 | 1,157 | 密钥、CORS 或其他条件更适合服务端适配 |
| OAuth 集成 | 147 | 需要用户授权和令牌生命周期设计 |
| 建议寻找替代 | 92 | 目录未声明支持 HTTPS |

这些统计来自目录字段，不代表 API 已经通过真实调用验证。

## 快速开始

要求 Node.js 18 或更高版本，无第三方依赖。

```powershell
cd projects/public-apis-intelligence

# 推荐：启动本地演示服务
npm run demo
```

打开终端输出的地址：<http://127.0.0.1:4179/demos/public-apis-intelligence/>。

也可以直接双击 `docs/demos/public-apis-intelligence/index.html`；演示数据会通过本地脚本包加载，不再依赖 `file://` 下被浏览器禁止的 JSON 请求。

数据更新与验证：

```powershell
cd projects/public-apis-intelligence

# 从 GitHub 获取最新 README、仓库元数据和提交信息，并刷新演示数据
npm run sync

# 在没有网络时，用已保存快照重新生成全部产物
npm run sync:offline

# 验证条目完整性、唯一 ID、分类覆盖和统计守恒
npm test
```

## 数据管线

```text
GitHub README 快照           农业官方文档核验清单
          ↓                         ↓
  Markdown 全量解析          可追溯扩展数据构建
          └──────────┬──────────────┘
                     ↓
        11 个能力域 + 52 分类 + 细分场景
                     ↓
              接入规则评估
                     ↓
       JSON / CSV / Summary + 静态演示
```

上游仓库的核心数据集中在 README。为了让统计可复现，同时避免复制无关 Git 历史，本项目保存 README 快照和精确提交 SHA；`npm run sync` 可以随时获取新版本。

## 目录说明

```text
public-apis-intelligence/
├─ DESIGN_CONTRACT.md          # 演示范围、体验和验收契约
├─ NOTES.md                    # 实验过程与边界
├─ lib/catalog.mjs             # Markdown 解析、能力映射、评分与统计
├─ lib/scenarios.mjs           # 全分类细分场景词典、匹配和候选排序
├─ scripts/
│  ├─ sync.mjs                 # 在线/离线同步和导出
│  ├─ serve.mjs                # npm run demo 的无依赖静态服务器
│  └─ test.mjs                 # 数据完整性与守恒检查
└─ data/
   ├─ source/                  # README 与上游提交信息
   ├─ extensions/              # 经官方文档复核的农业扩展清单
   └─ generated/               # apis.json、apis.csv、summary.json
```

公开演示位于 `docs/demos/public-apis-intelligence/`，数据由同步脚本自动复制，避免页面和研究数据漂移。同步器同时生成 `catalog-data.js`，用于绕过普通浏览器对 `file://` JSON 请求的限制。

## 数据字段

| 字段 | 含义 | 来源 |
| --- | --- | --- |
| `name`, `description`, `url` | API 名称、说明和文档入口 | 上游 README |
| `category`, `auth`, `https`, `cors` | 原始分类和接入属性 | 上游 README |
| `sourceType`, `sourceName`, `officialDocs`, `verifiedAt` | 上游/扩展来源及核验依据 | 上游元数据或本项目官方文档复核 |
| `coverage`, `limitations` | 农业扩展源的覆盖范围与已知限制 | 官方文档摘要 |
| `group` | 11 个能力域之一 | 本项目规则映射 |
| `scenarios` | 细分场景、目录匹配置信度和命中词 | 本项目按名称/描述推断 |
| `dataObjects`, `typicalInputs`, `exampleFields`, `question` | 数据内容、调用输入、返回字段示例和业务问题 | 本项目数据对象词典与场景规则 |
| `score`, `tier`, `dimensions` | 目录接入准备度及其分项 | 本项目规则推断 |
| `useMode` | 建议接入方式 | 本项目规则推断 |
| `risks`, `recommendation` | 风险提示和下一步建议 | 本项目规则推断 |

## 质量评分边界

当前分数满分 100：HTTPS 30、CORS 20、认证成本 20、文档链接 15、描述完整度 15。

它适合回答：

- 哪些条目更适合作为快速原型候选？
- 哪些条目需要服务端保护密钥？
- 哪些条目存在 HTTP 或 CORS 风险？
- 同一分类中应该优先验证谁？

它不能回答：

- API 此刻是否存活；
- 延迟、成功率与 SLA；
- 免费额度、价格与限流；
- 商业使用和数据再分发许可；
- 数据准确性、覆盖度和更新时间。

这些缺口正是后续“主动探测与供应商评估层”的研究范围。

## 验证方法

```powershell
npm run sync:offline
npm test
```

浏览器验收覆盖：桌面浅色、桌面深色、平板、390px 手机、场景搜索、场景到 API 的联动筛选、无结果、详情弹窗、Escape 关闭和焦点返回。

场景匹配使用目录条目的名称与简短描述；12 个农业扩展额外完成官方文档层面的来源核验，但仍不代表真实调用或生产认证。页面会展示匹配词、置信度与来源；生产选型仍需核对端点、字段、额度、许可、覆盖范围和实时可用性。

“常见返回字段”是帮助理解数据形态的跨供应商字段语义，不保证与每一家 API 的原始 JSON 字段名完全一致。例如页面显示“降水概率”，真实服务可能使用 `precipitation_probability`、`pop` 或其他字段名，必须以供应商文档为准。

## 来源与许可

上游目录与脚本以 MIT License 发布。本项目保留来源 URL、提交 SHA 和许可证说明；第三方 API 的服务条款、数据许可证和商用权限不由上游 MIT License 覆盖，使用前必须分别核对。
