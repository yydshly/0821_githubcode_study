# 核心技术路线研究演示契约

## Design contract

```text
Entry mode: Revision-led implementation
Request revision: 7
Target user and context: 评估 Moovie 技术路线、准备自建视频播放网站的产品与研发人员
Desired first impression: 一眼看清数据从哪里来、系统做了什么、最终产生什么效果
Visual ambition: Functional
Experience architecture: Editorial Flow
Visual constraints: 研究工具而非消费端视频网站；来源、处理、结果保持一致的信息层级；状态不只依靠颜色表达
Information constraints: 聚焦豆瓣元数据、AppleCMS 资源、媒体身份匹配、播放候选与换线；数据库和部署仅保留边界说明
Operation constraints: 保留原技术路线实验；新增独立“公开版权目录”，直接查询 Internet Archive、Wikimedia Commons、Library of Congress、NASA 官方公开 API；开放许可或符合本研究展示条件的结果可播放，权利字段缺失时必须禁播；零 npm/CDN 运行依赖；键盘可操作
State constraints: 保留既有搜索、来源、匹配、HTTP 熔断和独立 HLS 实验；公开目录显示 loading/success/error、Provider 独立状态、open/open_with_attribution/conditional/review 和真实播放器状态；review 必须移除媒体地址并停止播放；原有 manual_review/no_candidates 继续阻止 Hls.js 启动
Environment constraints: 不请求真实豆瓣或未知 AppleCMS 影视源；公开目录网关仅访问四个固定官方 API；不实现任意 URL 代理；媒体地址只能来自规范化后的官方响应；Internet Archive/Wikimedia 只放行 Public Domain、CC0、CC BY、CC BY-SA；LOC 无明确权利声明时只展示不播放；NASA 依据官方指南仅用于本研究的教育/信息展示并保留使用条件；Hls.js 使用固定上游提交内的 vendored 1.4.12
Canonical runtime: 静态页 `python -m http.server 4173 --bind 127.0.0.1 --directory projects/moovie-video-playback`；假源 `node projects/moovie-video-playback/lab/server/fault-lab-server.cjs --port 4174`；页面 `http://127.0.0.1:4173/lab/`
Primary journey: 在公开目录搜索 `Big Buck Bunny`→四个官方 Provider 并发返回→结果卡展示来源、创作者、许可证、归属与可播放状态→选择 Wikimedia/Internet Archive 开放许可结果→浏览器直接播放 WebM/MP4；再搜索 LOC 结果观察缺少逐条权利声明时禁播；既有五场景与独立诊断保持回归
User-defined phases: 上方搜索；官方来源声明；AppleCMS 形状候选；身份匹配；白名单代理；外部真实解码；既有本地换线；安全停止；独立诊断面板
Required artifacts: 原生来源审计、公开 Provider 矩阵、四个真实 API 适配器、逐条版权闸门、MP4/WebM/HLS 播放交接、外部网络/首帧证据、既有场景回归、自动化测试、浏览器验收记录、修订后的研究结论
Autonomy authorization: 用户明确要求“请继续”，允许在现有研究前端内直接扩展和验证
User-decision boundary: 接入真实豆瓣账号、未知 AppleCMS 影视源、需要 API Key/登录的商业平台、生产媒资托管、最终法律意见或对外部署均不在本轮授权内；任意用户 URL 代理不实现
Observable completion criteria: 搜索 `Apple Bip Bop` 后页面明确显示 Apple Developer 官方测试来源；候选地址经允许列表代理交给 Hls.js；浏览器 Network 同时证明本地代理请求及服务器实时上游请求，视频出现非本地测试图首帧并播放超过 3 秒；代理拒绝越界路径；既有雾港/荒原/安全分支/独立故障面板仍通过；桌面/平板/390px 手机、主题、键盘和 reduced-motion 重新通过
Coverage record: 见下表
```

## 设计方向

| 决策 | 方向 | 可观察约束 | 验收标准 |
| --- | --- | --- | --- |
| 信息层级 | 顶部总览 + 四站纵向流水线 | 每站固定呈现“来源 / 能力 / 效果” | 首屏能识别完整链路；展开站点不改变概念顺序 |
| 视觉语义 | 蓝色表示外部输入，紫色表示系统处理，绿色表示验证通过，红色表示失败/拒绝 | 状态同时有文本和图标 | 不依赖颜色也能读懂结果 |
| 操作 | 一个主操作运行完整链路，每站有独立重放 | 运行期间禁用重复触发并展示当前站 | 完整旅程和单站旅程均可完成 |
| 主题 | 浅色、深色使用同一组语义 token | 文本、边框、代码块和状态标签保持可读 | 两个主题均无信息丢失 |
| 响应式 | 桌面三栏，窄屏改为纵向 | 390px 不横向溢出，控制仍可点击 | 1440 / 768 / 390 三种宽度通过 |
| 动效 | 只用于解释运行和换线；遵循 reduced-motion | 关闭动效后状态仍完整呈现 | reduced-motion 不隐藏过程或结果 |

## Revision 2 baseline and direction

| 项目 | 修订前浏览器证据 | 缺口 | 本轮最小一致改动 | 验收标准 |
| --- | --- | --- | --- | --- |
| 主旅程 | `desktop-light-complete.png` 只能运行固定“雾港档案” | 用户不能直接搜索和比较来源 | 在 hero 与路线图之间加入搜索工作台，并让选择结果驱动现有四站 | 搜索→选择→四站形成一个键盘可达闭环 |
| 来源模型 | 只展示豆瓣命中场景 | 无法回答“豆瓣没有怎么办” | 增加 TMDB 回退、资源反向建档和无资源场景 | 每个结果明确标注元数据来源和播放资源状态 |
| 状态反馈 | 固定场景总能进入换线成功 | 无结果、待确认、不可播放缺失 | 增加空搜索、无匹配、待确认和无候选终态 | 每种状态说明下一步，不伪造可播放结果 |
| 视觉层级 | hero 主操作是“运行完整链路” | 搜索应成为新主操作 | 搜索框成为首个业务操作，“运行”退为所选内容的下一步 | 首屏可直接输入并看到示例提示 |

## Coverage manifest

## Revision 3 baseline and direction

| 项目 | 修订前浏览器证据 | 缺口 | 本轮最小一致改动 | 验收标准 |
| --- | --- | --- | --- | --- |
| 资源请求 | 资源站只由 fixture 瞬时返回 | 看不到真实 HTTP 状态与耗时 | 增加独立本地假 AppleCMS，前端使用 `fetch` + 超时控制 | Network 中可见本地请求，结果显示状态码、耗时和分类 |
| 线路健康 | 四站演示直接给出失败换线结果 | 看不到连续失败如何阻断请求 | 增加三次失败熔断、短冷却、half-open 恢复实验 | 可观察 `closed → open → half-open → closed` |
| HLS 故障 | 安全 Canvas 只演示播放生命周期 | 未验证清单和分片是两个故障层 | 增加 HLS 清单与首分片真实传输探针 | 能区分 manifest/segment 故障并换至健康线路 |
| 能力边界 | 页面说明“不请求真实视频” | 容易把传输探针误解为真实解码 | 在实验区和结论中明确“传输可达 ≠ 解码可播” | 每个成功结果同时显示验证范围与未验证项 |


| 用户阶段 | 要求或产物 | 界面 / 状态 | 所需证据 | 所属阶段 | 状态 | 下一动作 |
| --- | --- | --- | --- | --- | --- | --- |
| 全链路 | 可运行页面和主旅程 | 桌面、初始→完成 | 浏览器交互、截图、DOM | 1/5 | pass | 1440px 完成四站并产生 6 个事件 |
| 豆瓣元数据 | 来源、能力、效果 | 初始→规范媒体 | DOM、fixture、测试 | 3/6/9 | pass | 展示端点形状、规范化能力和 Media 结果 |
| 视频资源 | 来源、能力、效果 | 搜索→候选资源 | DOM、fixture、测试 | 3/6/9 | pass | 展示 3 个来源、5 个 HLS 候选和 1 个 MP4 过滤项 |
| 资源匹配 | 精确、启发式和拒绝证据 | 三种匹配决策 | DOM、测试 | 5/6/9 | pass | ID 接受、标题层接受、年份冲突拒绝均可解释 |
| 播放换线 | 同集排序、失败、换线、进度保留 | A 失败→B 成功 | 浏览器交互、事件日志、测试 | 5/6/9 | pass | `fatal_error → source_switched → played_10s`，保持 S01E03 |
| 主题 | 浅色和深色 | 完成态 | 浏览器截图/DOM | 7 | pass | 浅→深切换通过；手机深色完成态截图保留 |
| 响应式 | 桌面、平板、手机 | 完成态 | 1440/768/390 截图 | 7 | pass | 三种宽度均无横向溢出，旅程完成 |
| 键盘 | 主操作、站点按钮、主题按钮 | 完整旅程 | 浏览器键盘路径 | 7 | pass | Tab 到达主操作，焦点可见，Enter 完成链路 |
| reduced-motion | 关闭非必要动画 | 完成态 | 浏览器媒体查询/DOM | 7/8 | pass | 390px 深色环境启用 reduce，结果和事件完整 |
| 工程验证 | 核心逻辑测试 | Node | 测试输出 | 9 | pass | 语法检查通过；Node 测试 6/6 |
| 研究交接 | 复现方式和证据 | 文档 | 文件检查 | 9 | pass | README、结果报告和两张最终截图已保留 |

### Revision 2 reopened coverage

| 用户阶段 | 要求或产物 | 界面 / 状态 | 所需证据 | 所属阶段 | 状态 | 下一动作 |
| --- | --- | --- | --- | --- | --- | --- |
| 直接搜索 | 输入片名并返回相关示例 | 桌面/手机，输入→结果 | 浏览器交互、DOM、测试 | 3/4/5 | pass | 片名和场景关键词搜索通过；未知词返回空状态 |
| 来源状态 | 每个结果显示豆瓣、替代源、资源数 | 四类结果卡片 | DOM、fixture、测试 | 3/6/9 | pass | 初始页显示 4 个样例及三段来源状态 |
| 豆瓣命中 | 选择后运行原完整链路 | 雾港档案 | 浏览器事件和回归测试 | 5/6/9 | pass | 原 6 事件换线链路保持通过 |
| 豆瓣缺失 | TMDB 元数据仍建立 Media 并播放 | 荒原来信 | 浏览器交互、测试 | 5/6/9 | pass | `tmdb:demo-92001` 建档并稳定播放，不伪造换线 |
| 资源反向建档 | 元数据皆无时生成待确认 Media | 青石巷短剧 | 浏览器状态、测试 | 5/6/9 | pass | `provisional_identity` 进入 0.75 复核，候选隔离 |
| 无播放资源 | 有元数据但候选为空 | 孤岛样片 | 浏览器空状态、测试 | 5/6/9 | pass | 明确 `no_candidates`，保留目录、不进入播放器 |
| 无搜索结果 | 未知关键词给出可恢复提示 | 空结果 | 浏览器交互、测试 | 6 | pass | 未知词无结果卡并提示可用示例 |
| 主题/响应式/键盘 | 新搜索闭环保持原支持 | 1440/768/390、深浅色、Tab/Enter | 浏览器矩阵 | 7/8 | pass | 三视口无溢出；Tab 到搜索框，Enter 提交；reduce 通过 |
| 工程验证 | 搜索与多场景管线测试 | Node | 测试输出 | 9 | pass | 语法检查通过；Node 测试 11/11 |
| 研究交接 | 更新运行说明、结果和新截图 | 文档/证据 | 文件检查 | 9 | pass | README、结果报告和搜索完成态截图已更新 |

### Revision 3 reopened coverage

| 用户阶段 | 要求或产物 | 界面 / 状态 | 所需证据 | 所属阶段 | 状态 | 下一动作 |
| --- | --- | --- | --- | --- | --- | --- |
| 真实本地请求 | 假 AppleCMS 返回真实 HTTP 响应 | 200 / 429 / 500 / timeout / invalid JSON | 浏览器 Network、DOM、集成测试 | 1/5/6/9 | pass | 浏览器观察到 17 个本地请求，五类响应均通过 |
| 故障分类 | 状态码、耗时、错误种类可读 | 请求中→成功/失败 | 浏览器交互、单元测试 | 5/6 | pass | 五类结果均显示状态、耗时和分类 |
| 熔断恢复 | 连续失败阻断、冷却、探测恢复 | closed→open→half-open→closed | 浏览器时间线、单元测试 | 5/6/8/9 | pass | 三次失败熔断，阻断请求，单次探测后恢复 |
| HLS 传输 | 清单和首分片分别探测 | 健康/清单失败/分片失败 | 浏览器 Network、集成测试 | 5/6/8/9 | pass | manifest 503 与 segment 503 分别识别 |
| HLS 换线 | 失败源切换至健康源 | 分片失败→线路 B 成功 | 浏览器时间线、测试 | 5/6/9 | pass | 线路 1 分片失败后线路 2 传输通过 |
| 能力边界 | 不把传输探针冒充真实解码 | 所有成功态 | DOM、文档审计 | 3/6/9 | pass | 结果卡和报告均明确“尚未验证解码” |
| 回归矩阵 | 原搜索与四站、主题、响应式、键盘 | 1440/768/390、深浅、reduce | 浏览器矩阵 | 7/8 | pass | 三视口、主题、reduce、四条键盘路径通过，0 错误 |
| 工程验证 | 单元、集成、语法检查 | Node | 测试输出 | 9 | pass | 语法检查通过；Node 测试 15/15 |
| 研究交接 | 双服务复现说明、结果和截图 | 文档/证据 | 文件检查 | 9 | pass | README、结果报告和故障实验截图已更新 |

### Revision 4 reopened coverage

| 用户阶段 | 要求或产物 | 界面 / 状态 | 所需证据 | 所属阶段 | 状态 | 下一动作 |
| --- | --- | --- | --- | --- | --- | --- |
| 可解码 fixture | 自生成、无版权风险的 HLS VOD | `.m3u8` + 多个 MPEG-TS | FFprobe/文件/生成脚本 | 1/8/9 | pass | 12 秒 H.264/AAC、640×360、6 分片经 FFprobe 校验 |
| 真实 Hls.js 解码 | 使用上游 vendored Hls.js 播放 | 初始化→清单→首帧→时间推进 | 浏览器视频状态、Network | 5/6/8 | pass | readyState 4、640×360、首帧 193 ms、播放超过 3 秒 |
| 播放中故障 | 线路 A 的中段分片返回 503 | 正常首帧→fatal_error | 浏览器事件、服务集成测试 | 5/6/9 | pass | segment002 503 产生 fragLoadError @ 2.82 s |
| 进度保留换线 | 故障后切换健康线路 B | source_switched→恢复首帧→继续播放 | 浏览器 currentTime、事件顺序 | 5/6/8/9 | pass | 2.82 s → 2.82 s，位置差 0.00 s，继续播放 1.5 秒 |
| 能力边界 | 区分模拟、传输和真实解码 | 实验标题、状态、结论 | DOM、文档审计 | 3/6/9 | pass | 三类能力分别命名，本地合成 VOD 边界明确 |
| 回归矩阵 | 既有功能与新播放器共存 | 1440/768/390、深浅、reduce、键盘 | 浏览器矩阵 | 7/8 | pass | 三视口、主题、reduce、真实播放器键盘路径和 MSE 回退通过 |
| 工程验证 | 媒体端点、换线控制、语法 | Node/FFprobe | 测试输出 | 9 | pass | Node 16/16；FFprobe H.264/AAC 12 秒；浏览器 0 错误 |
| 研究交接 | 生成、运行、效果说明和截图 | 文档/证据 | 文件检查 | 9 | pass | README、结果报告、生成脚本和真实换线截图已更新 |

### Revision 5 reopened coverage

| 用户阶段 | 要求或产物 | 界面 / 状态 | 所需证据 | 所属阶段 | 状态 | 下一动作 |
| --- | --- | --- | --- | --- | --- | --- |
| 场景候选映射 | 上方匹配候选对应真实本地 HLS | 雾港 A/B、荒原 D | fixture/DOM/测试 | 3/5/9 | pass | 排序结果直接携带 faulty/healthy localhost URL；安全场景为零候选 |
| 解码交接 | 第四站直接启动 Hls.js | matching complete→decoder_handoff | 浏览器 Network/video | 5/6/8 | pass | 共享会话接收页面排序候选，Network 与 video 均观察到真实交接 |
| 雾港真实换线 | 上方玩家 A 故障后切 B | 首帧→503→恢复→继续 | 浏览器事件/currentTime/截图 | 5/6/9 | pass | 9 个真实事件按序完成，播放器为 640×360，A/B 均有媒体请求 |
| 荒原真实稳定播放 | 上方玩家使用健康线路 | 首帧→连续播放 | 浏览器事件/无换线断言 | 5/6/9 | pass | `decoder_handoff → manifest_loaded → first_frame → played_3s`，无换线事件 |
| 安全停止 | 待复核/无资源不启动解码 | manual_review/no_candidates | 浏览器 Network/DOM | 5/6/9 | pass | 两个安全场景均保持终态且新增可解码媒体请求为 0 |
| 独立诊断回归 | A/B/C 面板仍可独立运行 | HTTP、传输、真实 HLS | 浏览器矩阵 | 7/8 | pass | AppleCMS、熔断、HLS 传输与独立真实解码全部回归通过 |
| 跨界面回归 | 新主旅程保持响应式/主题/键盘 | 1440/768/390、深浅、reduce | 浏览器矩阵 | 7/8 | pass | 三视口无溢出；主题、reduce、键盘路径通过；0 个非预期错误 |
| 工程与交接 | 测试、文档和最终证据 | Node/文档/截图 | 测试输出与文件 | 9 | pass | Node 17/17；浏览器矩阵通过；README、报告和聚焦截图已更新 |

### Revision 6 reopened coverage

| 用户阶段 | 要求或产物 | 界面 / 状态 | 所需证据 | 所属阶段 | 状态 | 下一动作 |
| --- | --- | --- | --- | --- | --- | --- |
| 官方来源场景 | 可搜索且不与本地 fixture 混淆 | Apple Bip Bop 搜索卡 | fixture/DOM/测试 | 3/5/9 | pass | 第五张卡明确标注 Apple Developer、外部 CDN 和白名单代理 |
| 白名单代理 | 只代理 Apple 官方示例固定路径 | 允许/拒绝/上游失败 | 单元与集成测试 | 5/6/8/9 | pass | 主/嵌套清单和分片重写通过；外域与越界路径拒绝；无开放代理 |
| 外部真实播放 | 排序候选直接播放 Apple CDN 内容 | 清单→首帧→播放 3 秒 | Browser Network/video/截图 | 5/6/9 | pass | 14 个代理请求；416×234；3.47 s；四事件按序完成 |
| 来源可解释性 | 显示官方页面、原始域名、代理原因 | 搜索卡/候选/播放站 | DOM/截图 | 3/6 | pass | 官方页面链接、Apple CDN、允许路径、CORS 原因和代理标签均可见 |
| 既有回归 | 四场景和独立诊断不退化 | 本地换线/稳定/安全/故障面板 | 浏览器矩阵 | 7/8 | pass | 1440/768/390、主题、reduce、键盘、熔断和本地真实换线全部通过 |
| 工程与交接 | 测试、文档和最终证据 | Node/文档/截图 | 测试输出与文件 | 9 | pass | Node 18/18；真实浏览器通过；README、报告和外部流截图已更新 |

### Revision 7 reopened coverage

| 用户阶段 | 要求或产物 | 界面 / 状态 | 所需证据 | 所属阶段 | 状态 | 下一动作 |
| --- | --- | --- | --- | --- | --- | --- |
| 原生来源审计 | 区分目录、资源、播放器和 ID 映射 | 来源矩阵 | 固定提交源码 | 1/3/9 | pass | 确认视频资源只实现 AppleCMS，豆瓣/TMDB 不提供正片 |
| IA 公开电影 | 实时搜索、许可、MP4 播放 | open/open_with_attribution→playing | API/Browser/video | 5/6/9 | pass | 5 条；640×360；播放到 1.01 s |
| Wikimedia 视频 | 文件级许可、署名、WebM 播放 | open_with_attribution→playing | API/Browser/video | 5/6/9 | pass | 3 条；854×481；播放到 1.02 s |
| NASA 视频 | 官方资产与有条件使用说明 | conditional→playing | API/Browser/video | 5/6/9 | pass | 6 条；320×234；播放到 1.01 s；限制可见 |
| LOC 权利闸门 | 搜索可见但声明缺失时禁播 | review→RIGHTS REVIEW | API/DOM/video | 5/6/9 | pass | 6 条、0 自动放行；src 被移除且暂停 |
| 网关安全 | 固定 Provider、无任意代理 | unknown_provider | Node/HTTP | 6/8/9 | pass | 未知 Provider 返回 400；媒体 URL 只来自官方响应 |
| 跨界面回归 | 原五场景、故障、主题、响应式、键盘 | 1440/768/390 | 完整浏览器矩阵 | 7/8/9 | pass | 全部通过；0 非预期控制台错误、无横向溢出 |
| 工程与交接 | 测试、矩阵、证据 | Node/文档/截图 | 测试输出与文件 | 9 | pass | Node 23/23；两套浏览器检查通过；来源矩阵已更新 |

## Terminal audit

- 所有用户要求的四站均同时展示来源、能力和效果；
- 搜索、豆瓣回退、资源反向建档和无资源四类分支均有浏览器证据；
- manifest 无 `continue`、`defer` 或 `blocked`；
- 未知 AppleCMS 和生产接入仍属于明确边界；公开 API 只按逐条权利字段或官方使用指南放行，不外推到同站全部内容；
- 工程测试、真实浏览器交互和最终截图证据一致。
- 上方搜索结果的排序候选与 Hls.js 实际请求地址一致；安全终态没有媒体旁路请求。
- Apple 外部场景的代理响应标识与实际媒体请求一致；代理范围固定，不能访问任意主机或路径。
- 四个公开 Provider 使用固定 API，IA/Wikimedia/NASA 已真实解码；LOC 缺权利声明时正确禁播；manifest 无 `continue`、`defer` 或 `blocked`。
