# Public APIs Intelligence 设计契约

```text
Entry mode: brief-led implementation
Request revision: 6
Target user and context: 需要盘点公共 API、做技术选型和统一接入设计的研究人员与工程师
Desired first impression: 不需要理解抽象领域名，也能立刻看出“这里有哪些具体数据、能解决什么问题、该用哪个 API”
Visual ambition: Functional
Experience architecture: Editorial Flow
Visual constraints: 信息密度高但不拥挤；以数据、筛选和风险提示为主；不依赖高成本视觉效果
Information constraints: 必须区分 public-apis 上游事实、本项目外部扩展源、规则推断和仍需实测的质量；不得把目录分数描述为真实 SLA；领域名称只能作为内部导航，用户可见的主信息必须是具体数据对象、字段示例、业务问题和候选 API
Operation constraints: 静态 GitHub Pages；无框架、无后端、无密钥；搜索、组合筛选、排序和详情均在浏览器本地完成
State constraints: 加载、成功、无结果和加载失败状态可辨认；详情抽屉支持关闭、Escape 与焦点返回
Environment constraints: 现代桌面/平板/390px 手机浏览器；支持浅色/深色；尊重 reduced-motion
Primary journey: 查看研究过程与归档边界 → 查看“有哪些具体数据” → 选择数据对象或描述业务问题 → 查看字段与使用例 → 比较候选 API → 阅读接入风险 → 打开原始文档
User-defined phases: 获取上游；全量整理；类型/质量/建议统计；交互演示；过程归档；提交远端；GitHub Pages 部署
Required artifacts: 可重复同步脚本、README 快照、JSON/CSV、统计摘要、测试、静态演示、研究记录、归档档案、过程网页、总索引、Git 提交与 Pages 部署
Autonomy authorization: 用户明确要求沉淀研究过程与文档、提交到远端 GitHub，并将过程网页部署到 GitHub Pages；可直接完成范围内实现、提交、推送和部署验证
User-decision boundary: 引入真实 API 密钥、批量调用第三方服务、付费订阅或生产网关不在本阶段授权范围
Observable completion criteria: 全量条目可追溯到上游快照；统计总数自洽；筛选/排序/详情可用；研究过程、归档边界和重启条件在网页与文档中可见；桌面/手机无关键遮挡；相关文件独立提交到 main；Pages 工作流成功且线上 URL 可访问
```

## 设计方向

| 决策 | 方向 | 可观察约束 | 验收标准 |
| --- | --- | --- | --- |
| 信息层级 | 搜索和筛选领先，指标与图表辅助 | 首屏能看见搜索、总量和核心风险 | 不阅读说明也能开始找 API |
| 数据可信度 | 每个推断都显示依据和边界 | 分数旁固定显示“目录推断” | 不出现“可靠性已验证”等误导文案 |
| 视觉语言 | 中性研究工作台，蓝色表示行动，绿色表示可直接试用，橙红表示风险 | 颜色之外同时有文字标签 | 黑白或色弱情况下仍可理解状态 |
| 密度 | 桌面使用表格，窄屏转为卡片 | 不横向滚动主页面 | 390px 可完成完整筛选与详情阅读 |
| 主题 | 浅色默认，支持深色切换与系统偏好 | 语义色、边框和焦点环均使用主题变量 | 两个主题的内容和控件均清晰可读 |
| 动效 | 只用于抽屉和状态切换 | reduced-motion 下取消非必要过渡 | 动效不影响完成任务 |

## 覆盖清单

| 用户阶段 | 要求/产物 | 表面/状态 | 证据 | 阶段 | 状态 | 下一步 |
| --- | --- | --- | --- | --- | --- | --- |
| 获取上游 | 固定 README 与提交信息 | 数据管线 | 文件、SHA、同步日志 | 1 | pass | 快照固定为 `c045a2eb505f` |
| 全量整理 | JSON/CSV 条目与类型映射 | 生成数据 | 自动测试 | 3 | pass | 1,695 条、51 分类、唯一 ID 与统计守恒通过 |
| 质量建议 | 接入准备度、模式与风险 | 数据/页面 | 规则说明与分布统计 | 3 | pass | 分项、边界和缺失证据均可见 |
| 交互演示 | 搜索、组合筛选、排序、详情 | 桌面浅色 | 浏览器截图与交互 | 5 | pass | 搜索、组合筛选、无结果、详情通过 |
| 交互演示 | 同一主路径 | 桌面深色 | 浏览器截图与交互 | 7 | pass | 深色主题可读性通过 |
| 交互演示 | 同一主路径 | 平板浅色 | 浏览器截图 | 7 | pass | 768×900 无孤字和关键遮挡 |
| 交互演示 | 同一主路径 | 390px 手机浅色 | 浏览器截图与交互 | 7 | pass | 无横向溢出，卡片和弹窗通过 |
| 交付 | 数据一致性与页面语法 | 工程检查 | 测试输出 | 9 | pass | Node 语法与数据测试通过 |
| 交付 | 研究目录与展厅入口 | 仓库导航 | 文件检查 | 9 | pass | 根索引、项目索引和展厅卡片已更新 |
| 启动修复 | 普通浏览器直接打开 HTML 也能显示数据 | `file://` 默认安全策略 | DOM 结果数、错误状态、表格行数 | 8 | pass | 1,695 条、40 行首屏、无错误状态 |
| 启动修复 | 提供单一规范启动命令 | `npm run demo` / HTTP | 进程输出、URL、浏览器 DOM | 9 | pass | 4179 端口启动并通过浏览器验收 |
| 场景细化 | 51 分类形成更细业务场景 | 数据管线 | 场景覆盖率、场景数、API 反向映射 | 3 | pass | 301 条明确规则；1,129 条明确匹配；314 个有候选场景 |
| 场景细化 | 用户从“我要做什么”找到具体 API | 场景导航 | 搜索、场景卡、候选 API 与建议 | 5 | pass | 天气预报场景返回 11 个候选并联动探索器 |
| 场景细化 | API 详情解释适用场景 | 详情弹窗/表格 | 场景标签、匹配依据、选型提示 | 6 | pass | 详情显示置信度、命中词、典型产品和选型提醒 |
| 场景细化 | 桌面与 390px 手机可完成场景路径 | 浅色/深色/响应式 | 浏览器截图、交互和 DOM | 7 | pass | 桌面和手机通过；390px 无横向溢出 |
| 数据对象细化 | 十大领域不再是主要解释单位 | 能力版图/场景导航 | 每个领域显示具体数据对象清单 | 3 | pass | 51 个分类均有数据对象、输入、字段和问题资料 |
| 数据对象细化 | “公共与知识数据”可直接看懂包含哪些数据 | 数据目录 | 节假日、政府统计、法规、词典、专利等可见且可筛选 | 5 | pass | 默认展开 6 类资料；Government 可联动 6 个场景 |
| 数据对象细化 | 场景卡说明“会返回哪些字段” | 场景卡/API 详情 | 字段示例、输入、输出和真实问题示例 | 6 | pass | “法定节假日”显示字段、输入、问题和 13 个候选 API |
| 数据对象细化 | 桌面与 390px 手机保持清晰可操作 | 浅色/深色/响应式 | 浏览器截图、筛选路径和溢出检查 | 7 | pass | 1440、768、390px 通过；手机内容宽 375/视口 390 |
| 农业扩展 | 采用有官方文档依据的农业 API | 外部扩展数据源 | 官方 URL、认证方式、能力说明和核验日期 | 1 | pass | 12 个扩展源均有官方文档、核验日期、覆盖范围和限制 |
| 农业扩展 | 农业成为独立、可理解的数据领域 | 数据模型/能力目录 | 农业分类、数据对象、输入、字段和场景 | 3 | pass | 农业领域、1 个分类、10 个细场景全部有候选 |
| 农业扩展 | 用户搜索农业需求能找到候选 API | 场景导航/探索器 | 农业搜索、候选 API、来源标识和详情 | 5 | pass | 搜索“农业”得到 10 个场景；来源筛选得到 12 条扩展 |
| 农业扩展 | 原上游统计与扩展统计不混淆 | 指标/文档 | public-apis 数量、扩展数量、总数量分别可见 | 6 | pass | 页面与摘要分别显示 1,695 上游、12 扩展、1,707 合计 |
| 农业扩展 | 桌面与 390px 手机可完成农业路径 | 浅色/深色/响应式 | 浏览器截图、交互、详情和溢出检查 | 7 | pass | 桌面浅/深色与 390px 通过；手机 scrollWidth = 390 |
| 过程归档 | 页面说明本项目如何从资源清单走到能力账本 | 过程网页/桌面与手机 | 时间线、归档状态、边界和文档入口 | 3 | pass | 六阶段过程、归档状态和三个文档入口通过浏览器验收 |
| 文档沉淀 | 归档结论、过程、数据和重启条件可追溯 | GitHub 项目目录 | README、NOTES、ARCHIVE、设计契约和生成数据 | 8 | pass | README、NOTES、ARCHIVE、契约、数据与脚本齐备 |
| 远端提交 | 只提交 Public APIs Intelligence 相关资产 | Git 提交/main | 暂存清单、提交内容和远端 SHA | 9 | pass | 在独立 worktree 基于 `origin/main` 合入并推送；未带入工作区内其他项目改动 |
| Pages 部署 | 过程网页与能力账本公开可访问 | GitHub Pages | Actions 成功状态、线上 URL 与 HTTP/DOM 检查 | 9 | pass | `https://yydshly.github.io/0821_githubcode_study/demos/public-apis-intelligence/` 返回 200；线上桌面与 390px 手机验收通过 |

## 修复记录：本地数据未显示

```text
Current stage: 8 / capability fallback
User phase: 启动修复
Coverage item: 本地 HTML 数据加载
User goal: 打开演示后能够看到全量数据
Browser environment: Chromium，file://，默认本地文件安全策略
Observed evidence: “数据加载失败”，error state 可见，表格 0 行
Problem category: page data cannot load
Root cause: app.js 使用 fetch() 读取相邻 JSON；普通浏览器禁止 file:// 页面跨文件 fetch
Minimal intervention: 同步时生成普通 script 数据包，页面优先使用 window 内嵌数据；保留 HTTP fetch 作为兼容路径
Adjacent regression surfaces: npm run demo 的 HTTP 路径、同步生成、CSV 下载和初始 40 行渲染
Observed result: file:// 与 npm run demo 均显示 1,695/1,695，错误状态隐藏，初始表格 40 行
Decision: pass
Next executable action: none
New authority required: none
```
