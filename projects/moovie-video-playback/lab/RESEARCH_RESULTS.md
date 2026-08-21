# 第六轮研究结果：官方外部 HLS 来源真实播放

## 本轮回答的问题

我们已经用一个完全可控的实验回答：

```text
元数据如何进入系统
→ 外部资源如何变成剧集候选
→ 系统如何确认候选内容正确
→ 某条线路失败后如何在同一集内安全换线
```

这不是纸面流程。搜索结果里的 AppleCMS 形状候选会经过解析、匹配和排序，直接交给上方第四站的 Hls.js 会话；无需再到下方独立实验面板二次点击。四个业务场景仍使用可控 fixture；第五个 `Apple Bip Bop` 场景通过严格白名单代理实时请求 Apple Developer 官方 HLS，观察外部清单、首帧和播放时间推进。

## 可搜索场景结果

| 查询 | 豆瓣 | 替代/建档路径 | 资源与播放终态 |
| --- | --- | --- | --- |
| `雾港档案` | 命中 | 无需回退 | 3 个资源；真实 HLS 线路 A 中段 503 后同集切换 B |
| `荒原来信` | 无结果 | TMDB 命中，保留 `tmdb:demo-92001` | 2 个资源；健康 HLS 线路 D 直接稳定播放，不伪造换线 |
| `青石巷短剧` | 无结果 | TMDB 也无；资源反向生成 provisional Media | 1 个资源被隔离；0.75 复核，不自动播放 |
| `孤岛样片` | 命中 | 无需回退 | 0 个资源；保留目录并返回 `no_candidates` |
| `Apple Bip Bop` | 不适用 | Apple Developer 官方测试目录 | 1 个官方外部 HLS；白名单代理后真实播放 |
| 未知片名 | 无本地样例 | 不伪造元数据 | 返回可恢复的空搜索状态 |

## 每站来源、能力和效果

| 步骤 | 来源 | 验证的能力 | 演示效果 |
| --- | --- | --- | --- |
| 1. 元数据入口 | 脱敏豆瓣、TMDB 或资源反向建档 fixture；依据上游 `internal/catalog/douban.go`、`tmdb.go` 和媒体身份代码 | 提供方回退，将可用外部字段转成内部 `Media`；无外部身份时标记 provisional | 豆瓣和 TMDB 都能建立已确认 Media；资源反向建档只能进入人工复核 |
| 2. AppleCMS 资源 | 3 个脱敏 AppleCMS v10 响应；语法依据 `internal/search/applecms.go` 和 `internal/playurl/parse.go` | 按 `$$$ / # / $` 拆线路、剧集和 URL；季集归一；过滤非 HLS | 3 个资源响应产生 5 个 HLS 剧集候选，1 个 MP4 被当前主链明确过滤 |
| 3. 媒体身份匹配 | 规范 Media + 3 个资源；规则依据 `internal/search/service.go` 和 `internal/mediaidentity/match_score.go` | 外部 ID 精确层、标题年份类型层、年份冲突硬拒绝 | 演示源 A 以 1.00 接受，B 以 0.95 接受，2018 同名旧版 C 被拒绝 |
| 4. 播放换线 | 同一个 `media_unit_id=media-demo-001:S01E03` 的两个候选；排序依据 `internal/playback/health.go` | 贝叶斯平滑健康度、候选评分、失败排除、真实 Hls.js 解码、同集换线 | 排名第一的 A 首帧后发生真实分片 503，B 接管并从保存位置继续播放 |

## 事件证据

雾港主旅程稳定产生：

```text
decoder_handoff
→ manifest_loaded
→ first_frame
→ fatal_error
→ source_switched
→ attempt_started
→ manifest_loaded
→ first_frame_recovered
→ played_after_switch
```

换线前后页面始终显示 `S01E03`。播放地址来自页面已经展示的排序候选，不是播放器侧另行注入。自动化测试还注入了另一个 `media_unit_id` 的候选，并确认换线选择器不会使用它。

## 本地真实请求实验

本轮新增独立的 `127.0.0.1:4174` 零依赖服务。它不代理公网，也不发现视频源，只返回故障可控的本地 fixture。

### AppleCMS 请求与熔断

| 假源行为 | 浏览器观察 | 系统决策 |
| --- | --- | --- |
| HTTP 200 + 有效 `list` | `success`、状态 200、1 条资源、耗时 | 记录成功，失败计数清零 |
| HTTP 429 | `rate_limited` | 记录来源失败，不把响应当资源 |
| HTTP 500 | `http_error` | 记录来源失败 |
| HTTP 200 + 截断 JSON | `invalid_json` | 适配失败，不把 200 等同于成功 |
| 响应超过 650 ms | `timeout`，AbortController 主动取消 | 记录来源失败，释放当前请求 |

自动序列连续制造 3 次 HTTP 500。浏览器稳定显示：

```text
CLOSED
→ 3 × failure
→ OPEN（立即阻断下一请求，Network 中没有该次请求）
→ 1.2 s 实验冷却
→ HALF-OPEN（仅允许一次健康探测）
→ CLOSED（成功后清零失败计数）
```

1.2 秒只是为了让演示可操作；Moovie 上游的参考冷却时间是 5 分钟，生产参数应由实际流量和恢复成本确定。

### HLS 两阶段传输与换线

探针先请求 `.m3u8`，解析第一个非注释 URI，再请求 `segment0.ts`：

| 场景 | 清单 | 首分片 | 结果 |
| --- | --- | --- | --- |
| 健康线路 | 200 | 200 | `transport_success` |
| 清单故障 | 503 | 未请求 | `manifest_error` |
| 分片故障 | 200 | 503 | `segment_error` |
| 坏 A → 好 B | 200/503 | B 为 200/200 | 保持同一 MediaUnit，选择线路 2 |

浏览器验收共观察到 17 个 `127.0.0.1:4174` 请求，包括 AppleCMS 形状接口、`.m3u8` 和 `.ts`。成功结论严格限定为“清单与首分片可传输”；fixture 分片不是可解码媒体，因此没有声称真实 HLS 播放通过。

## 真实 Hls.js 解码实验

第四轮另生成一套可解码媒体，与上一节的传输 fixture 分开：

```text
时长：12.000 秒
视频：H.264 Main · 640×360 · 30 fps
音频：AAC LC · 48 kHz
分片：6 × 约 2 秒 MPEG-TS
内容：FFmpeg testsrc2 + 440 Hz 正弦波
播放器：上游 vendored Hls.js 1.4.12 + 浏览器 MSE
```

### 健康播放证据

Chromium 中 `video.readyState=4`，解码尺寸为 `640×360`，`currentTime` 从 0 推进到 3.32 秒。事件顺序为：

```text
INITIALIZED → ATTEMPT → MANIFEST → FIRST_FRAME (184 ms) → PLAYED_3S
```

### 播放中故障与恢复证据

故障线路 A 的 `segment002.ts` 在请求等待约 2.8 秒后返回 503，使前两个已缓冲分片先真实播放。最终浏览器观测：

```text
线路 A FIRST_FRAME：95 ms
故障：fragLoadError @ 2.81 s
保存位置：2.81 s
线路 B 恢复位置：2.81 s
位置差：0.00 s
恢复后继续播放到：4.70 s
```

事件闭环：

```text
FATAL_ERROR
→ SOURCE_SWITCHED
→ MANIFEST (线路 B)
→ SEEK
→ FIRST_FRAME_RECOVERED
→ PLAYED_AFTER_SWITCH
```

这证明本轮已经从“地址传输探针”升级到真实 H.264/AAC 解码和播放状态机。它仍只证明本地合成 VOD，不代表未知第三方 HLS 的授权、CORS、编码或稳定性。

## 第五轮：四个搜索场景已经打通

本轮把上方主旅程和第四轮独立解码实验合并为同一条业务链。真实本地 URL 写在 AppleCMS fixture 的原始播放串里，经过 `$$$ / # / $` 解析、媒体身份匹配和候选排序后，才交给共享 HLS 播放会话。

| 场景 | 排序结果进入播放器 | 浏览器可观察结果 |
| --- | --- | --- |
| 雾港档案 | A：`decodable-faulty`，B：`decodable-healthy` | A 首帧后 `segment002.ts` 返回预期 503；同集切换 B，恢复首帧并继续播放 |
| 荒原来信 | D：`decodable-healthy` | 清单、首帧和 3 秒播放通过；没有 `source_switched` |
| 青石巷短剧 | 0 个可播放候选 | 停在 `manual_review`；不请求可解码媒体 |
| 孤岛样片 | 0 个资源候选 | 停在 `no_candidates`；不请求可解码媒体 |

桌面浏览器中，雾港主旅程记录 9 个真实播放事件，实际请求故障线路和健康线路，播放器解码尺寸为 `640×360`。控制台只出现故障注入所必需的 1 次 `segment002.ts` 503，没有非预期错误。荒原主旅程产生 `decoder_handoff → manifest_loaded → first_frame → played_3s`，并确认没有伪造换线。

## 第六轮：Apple 官方外部测试流

为回答“是否真正使用外部来源”，本轮新增第五个可搜索场景 `Apple Bip Bop`。它引用 Apple Developer 官方 HLS Examples，不是影视资源站，也不提供影片目录。候选仍经过 AppleCMS 形状播放串解析、标题/年份/类型匹配和质量排序，再交给同一个 Hls.js 播放站。

Apple CDN 的示例清单没有向 localhost 返回 CORS，因此研究服务增加了严格白名单代理：

```text
唯一允许主机：devstreaming-cdn.apple.com
唯一允许路径：/videos/streaming/examples/bipbop_16x9/
处理内容：主清单、码率/音频/字幕清单和媒体分片
禁止能力：任意 URL、跨域名重定向、越出固定路径
```

真实 Chromium 结果：

```text
代理资源请求：14 个
Hls.js 清单解析：0.63 s
外部视频首帧：8.41 s
解码尺寸：416×234
媒体时长：1800.05 s
播放位置：推进到 3.47 s
事件：decoder_handoff → manifest_loaded → first_frame → played_3s
```

浏览器能看到 Apple Bip Bop 测试画面和字幕。每个代理响应带有 `X-Moovie-Upstream: developer.apple.com-hls-example`，证明页面得到的是允许列表中的外部响应，不是本地合成片。代理测试还验证了嵌套清单 URI 重写和外域引用拒绝。

## 自动化验证

### 核心逻辑

```text
Node syntax checks: pass
Node tests: 18 passed, 0 failed
```

覆盖搜索、元数据规范化、六种季集标签、AppleCMS 播放串、豆瓣/TMDB 精确匹配、资源反向建档、无资源终态、同集排序、不跨集换线、熔断状态机、五类真实 HTTP 响应、HLS 清单/分片故障、可解码媒体端点、中段分片注入、Apple 官方代理清单重写和外域拒绝。

### 浏览器验证

| 环境 | 完整旅程 | 主题/动效 | 布局 | 控制台 |
| --- | --- | --- | --- | --- |
| 1440 × 1000 | 通过 | 浅色；浅→深切换通过 | 无横向溢出 | 0 个非预期错误；1 个预期分片 503 |
| 768 × 1024 | 通过 | 浅色 | 无横向溢出 | 0 个非预期错误；1 个预期分片 503 |
| 390 × 844 | 通过 | 深色 + reduced-motion | 无横向溢出 | 0 个非预期错误；1 个预期分片 503 |
| 键盘 | Tab 可到达主操作、搜索框、来源探针和 HLS 探针；Enter 可运行 | — | — | 0 个非预期错误 |

故障实验在桌面浏览器验证 200/429/500/异常 JSON/超时、`open → half-open → closed`、HLS 传输坏 A → 好 B，以及真实解码坏 A → 好 B。故障注入产生的 503 被单独识别，除此之外没有控制台错误。键盘可运行真实 HLS；模拟 Hls.js/MSE 不可用时，页面显示清晰回退且传输探针仍可操作。

最终证据：

- [`evidence/desktop-search-complete.png`](./evidence/desktop-search-complete.png)
- [`evidence/scenario-real-hls-complete.png`](./evidence/scenario-real-hls-complete.png)
- [`evidence/external-apple-hls-complete.png`](./evidence/external-apple-hls-complete.png)
- [`evidence/mobile-dark-complete.png`](./evidence/mobile-dark-complete.png)
- [`evidence/fault-lab-complete.png`](./evidence/fault-lab-complete.png)
- [`evidence/real-hls-failover-complete.png`](./evidence/real-hls-failover-complete.png)

## 研究结论

六轮实验共同证明，研究价值不在“找到更多免费地址”，而在把不稳定来源约束为可解释、可恢复的系统行为：

1. 豆瓣可以被封装为可替换元数据适配器；无结果时 TMDB 或人工确认路径仍能继续；
2. AppleCMS 可以被限制在资源适配层；
3. 内容正确性能够在播放前形成可解释决策；
4. 200、JSON 可解析、HLS 清单成功、首分片成功和真实解码是不同层级，不能互相冒充；
5. 连续故障可以通过熔断减少无效等待，恢复必须经过受控探测；
6. 换线必须在同一 MediaUnit 候选集合内进行，并记录失败发生在清单层还是分片层。
7. 外部 HLS 即使内容合法公开，也可能因 CORS 无法直接播放；代理必须使用严格来源白名单，不能实现成开放转发器。

当前仍不能得出“可直接做生产视频网站”的结论。已经验证本地 H.264/AAC 的首帧与换线，以及一个 Apple 官方多码率外部 HLS 的真实播放；尚未验证真实豆瓣限流、合法影视资源准入、未知 HLS 的加密/字幕兼容、多浏览器兼容、连续卡顿、长期质量数据及生产代理安全。

## 第七轮：四个公开 Provider 的真实搜索、核权与播放

本轮不再把“来源卡片”当成演示数据，而是在 4174 网关中实现四个固定官方 API 适配器。网关只接受 Provider ID 和搜索词，不接受任意 URL；返回统一的 `provider / mediaUrl / mimeType / license / attribution / rightsStatus / playable / reason`。

| Provider | 搜索结果 | 自动可播 | 真实浏览器效果 |
| --- | ---: | ---: | --- |
| Wikimedia Commons · `Big Buck Bunny` | 3 | 3 | WebM，854×481，143.88 s，播放到 1.02 s |
| Internet Archive · `Big Buck Bunny` | 5 | 5 | MP4，640×360，596.57 s，播放到 1.01 s |
| NASA · `Apollo 11` | 6 | 6（有条件） | MP4，320×234，2902.67 s，播放到 1.01 s |
| Library of Congress · `silent film` | 6 | 0 | 缺逐条权利声明，显示 `RIGHTS REVIEW`，移除媒体地址并停止播放 |

IA 与 Wikimedia 只放行 PD、CC0、CC BY、CC BY-SA；CC BY-NC、All Rights Reserved 和未识别许可不会自动通过。NASA 结果显示教育/信息用途、事实性展示、不得暗示背书、第三方素材与人物权利另审。LOC 的接口虽然返回 MP4/HLS，但本轮结果没有机器可判定的逐条权利声明，因此没有尝试播放。

公开目录浏览器验收同时通过 1440px 桌面、390px 深色 reduced-motion 手机、0 横向溢出和 0 控制台错误。原有完整矩阵也重新通过：五个场景、Apple 外部 HLS、雾港真实换线、荒原稳定播放、两条安全终态、故障分类、熔断、独立 HLS 解码、三视口、主题和键盘均无回归。

```text
Node tests: 23 passed, 0 failed
Public browser check: pass
Full browser regression: pass
```

证据：

- [`evidence/public-wikimedia-playback.png`](./evidence/public-wikimedia-playback.png)
- [`evidence/public-catalog-complete.png`](./evidence/public-catalog-complete.png)
- [`evidence/public-catalog-mobile.png`](./evidence/public-catalog-mobile.png)

## 下一轮最有价值的实验

真实 HLS 解码和单次进度保留换线已经值得进入受控原型。下一轮应验证播放事件幂等、同一线路重试上限、连续卡顿、首帧慢和健康度重排；同时补充超大响应、重定向、DNS 重绑定、CORS/MIME、字幕和自适应码率等生产门禁。
