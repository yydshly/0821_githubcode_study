# 研究记录

## 获取信息

- 上游：`https://github.com/TwoThreeWang/Moovie.git`
- 本地形式：Git submodule
- 本地路径：`projects/moovie-video-playback/upstream`
- 固定提交：`8e15a52e1c7bb78d938837292faea3bc5de705a4`
- 提交时间：`2026-08-19T23:31:50+08:00`
- 提交主题：`feat(operations, mediaidentity): 新增遥测数据清理功能并优化媒体源快照存储`
- 分析重点：上游 `v4.0.0` 独立模块
- 许可证：固定提交中未发现 `LICENSE` 文件

## 可复现命令

```powershell
git submodule update --init --recursive
git -C projects/moovie-video-playback/upstream rev-parse HEAD
git -C projects/moovie-video-playback/upstream show -s --format="%cI %s" HEAD
```

聚焦测试从 v4 模块运行：

```powershell
Set-Location projects/moovie-video-playback/upstream/v4.0.0
go test ./internal/mediaidentity
go test ./internal/playurl
```

## 已审查文件

| 主题 | 文件 |
| --- | --- |
| 豆瓣目录、详情、短评、限流与缓存 | `internal/catalog/douban.go` |
| 豆瓣用户兴趣和 RSS 同步 | `internal/douban/client.go` |
| AppleCMS 搜索、详情和安全限制 | `internal/search/applecms.go` |
| 多源搜索编排与分层匹配 | `internal/search/service.go` |
| 来源熔断 | `internal/search/health.go` |
| AppleCMS 播放串解析 | `internal/playurl/parse.go` |
| 集标题解析和规范 episode key | `internal/mediaidentity/episode.go` |
| 资源线路、剧集候选展开 | `internal/mediaidentity/resource_parse.go` |
| 启发式匹配评分 | `internal/mediaidentity/match_score.go` |
| 同集候选健康度和排序 | `internal/playback/health.go` |
| 播放页候选装配 | `internal/playback/handler.go` |
| 近 7 天质量聚合 | `internal/mediaidentity/store.go` |
| 播放格式、事件与前端自动换线 | `web/static/js/player.js` |
| 播放器依赖 | `web/templates/pages/player.html`, `web/templates/pages/play.html` |

## 关键证据摘要

1. 豆瓣是目录/身份/评论来源，不返回播放 URL。
2. 外部视频来自管理员配置的 AppleCMS v10 API；系统不发现或托管资源。
3. AppleCMS 播放串支持多线路和多集语法，但解析器只保留 `.m3u8` URL。
4. 手工播放器加载 ArtPlayer、Hls.js 和 flv.js，并让原生 video 处理 MP4；因此播放器层与资源聚合层的格式能力不同。
5. 匹配优先使用人工关联和外部 ID，再使用标题等启发式证据。
6. 候选换线先严格限制同一规范季集，再按播放健康度与匹配置信度排序。
7. 自动换线最多两次，前端要求候选匹配置信度至少 0.90。
8. 播放器上报真实首帧、10 秒播放、卡顿和致命错误，形成质量反馈闭环。

## 本轮非目标

- 不评估 PostgreSQL 表结构、迁移策略或生产容量；
- 不复现 Docker/Kubernetes 部署；
- 不深入推荐、社区、弹幕、AI 网关、IPTV；
- 不验证或收集任何第三方盗版片源；
- 不将上游未知来源的 URL 用于实际内容播放。

## 待验证和限制

- 豆瓣和 AppleCMS 都是运行时外部依赖，接口行为可能变化。
- 本轮没有对真实第三方视频源发请求，因此未验证 CORS、证书、地区限制和播放成功率。
- 全量测试不是本轮门禁：上游部分集成测试依赖本地环境变量、PostgreSQL 或系统能力。本轮只运行与匹配/解析相关的纯逻辑测试，并在下方记录结果。
- 上游没有许可证时，只能把代码作为阅读材料；能否复用需法律确认。

## 测试结果

2026-08-21 在固定提交的 `v4.0.0` 模块执行：

```text
ok  github.com/TwoThreeWang/Moovie/new/internal/mediaidentity  0.437s
?   github.com/TwoThreeWang/Moovie/new/internal/playurl        [no test files]
```

结论：媒体身份、季集解析和候选排序相关包的现有测试通过；`playurl` 包可编译，但上游没有为 AppleCMS 播放串解析提供单元测试。这是我们重写时应优先补齐的测试缺口，至少覆盖多线路、空标题、非法地址、非 HLS 地址和剧集顺序。

## 第一轮纵向实验验证

研究演示位于 `lab/`。2026-08-21 的验证结果：

```text
核心管线语法检查：通过
核心管线 Node 测试：6 passed, 0 failed
浏览器完整旅程：desktop 1440 / tablet 768 / mobile 390 全部通过
匹配结果：精确 ID 接受、标题年份接受、年份冲突拒绝
换线结果：fatal_error → source_switched → played_10s
安全约束：换线保持 media-demo-001:S01E03，测试中的跨集候选未被选择
主题与输入：浅→深、reduced-motion、键盘 Enter 通过
浏览器错误：0
```

详细证据见 `lab/RESEARCH_RESULTS.md` 和 `lab/evidence/`。

## 第二轮可搜索多来源实验

固定演示已扩展为可搜索研究台，新增并验证四种结果：

```text
雾港档案：豆瓣命中 → 双线路失败换线
荒原来信：豆瓣无结果 → TMDB 建档 → 稳定播放
青石巷短剧：豆瓣/TMDB 均无 → 资源反向 provisional Media → 人工复核隔离
孤岛样片：豆瓣命中 → 资源为零 → no_candidates
未知片名：空结果，不伪造元数据或播放地址
```

核心 Node 测试扩展为 `11 passed, 0 failed`。浏览器在桌面、平板和 390px 手机重新通过；搜索框可通过 Tab 到达并用 Enter 提交，浏览器错误为 0。

## 第三轮真实本地故障实验

新增 `lab/server/fault-lab-server.cjs`，只监听 `127.0.0.1:4174`，不发出外部请求。浏览器真实验证：

```text
AppleCMS：200 / 429 / 500 / invalid JSON / timeout 均被区分
熔断：closed → 3 failures → open → blocked → half-open → closed
HLS：manifest 503 与 segment 503 被分别识别
换线：segment-error 线路 A → healthy 线路 B
能力边界：只证明清单和首分片传输，不声称 fixture 可解码播放
```

核心 Node 测试扩展为 `15 passed, 0 failed`。浏览器共观察到 17 个本地故障实验请求；桌面、平板、390px 手机、深浅主题、reduced-motion 和键盘路径重新通过，浏览器错误为 0。

## 第四轮真实 HLS 解码实验

使用 `lab/scripts/generate-hls-fixture.ps1` 生成 12 秒本地测试片：H.264 640×360 + AAC，六个约 2 秒 MPEG-TS 分片。前端直接复用固定上游提交内的 Hls.js 1.4.12。

Chromium 真实结果：

```text
健康线路：readyState=4，videoWidth=640，currentTime > 3 s
线路 A：first_frame → fragLoadError @ 2.81 s
线路 B：seek 2.81 s → first_frame_recovered，位置差 0.00 s
换线后：继续播放超过 1.5 s
MSE 回退：不可用时显示明确提示，HTTP/HLS 传输探针仍可操作
```

核心 Node 测试扩展为 `16 passed, 0 failed`。浏览器完整矩阵重新通过，真实故障实验共观察到 32 个本地请求，浏览器错误为 0。

## 第五轮搜索到真实播放闭环

上方四个搜索场景不再使用独立的模拟播放结果。可播放场景的本地 HLS 地址进入原始 AppleCMS 播放串，并经过解析、匹配与候选排序后直接交给共享 Hls.js 会话：

```text
雾港档案：候选 A 首帧 → segment002.ts 预期 503 → 同集候选 B 恢复并继续播放
荒原来信：候选 D 清单 → 首帧 → 连续播放 3 秒，无伪造换线
青石巷短剧：manual_review，0 个可解码媒体请求
孤岛样片：no_candidates，0 个可解码媒体请求
```

核心 Node 测试扩展为 `17 passed, 0 failed`。浏览器在 1440 / 768 / 390 三个视口完成主旅程和独立诊断回归；故障注入的 503 被识别为预期网络错误，非预期控制台错误为 0。

## 第六轮 Apple 官方外部 HLS

新增可搜索场景 `Apple Bip Bop`。视频候选经过现有解析、匹配和排序后，通过仅允许 `devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/` 的代理交给 Hls.js。代理会重写嵌套 HLS URI，拒绝外域和越界路径，不提供任意 URL 转发。

Chromium 最终实测 14 个代理资源请求，外部视频 `416×234`、时长约 1800 秒，首帧约 8.41 秒并播放到 3.47 秒。核心 Node 测试扩展为 `18 passed, 0 failed`；既有三视口、主题、键盘、本地故障和换线矩阵继续通过。
