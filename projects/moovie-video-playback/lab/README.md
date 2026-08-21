# 核心技术路线实验室

这是 Moovie 研究子项目的可搜索纵向演示和故障实验室。它不是视频网站，不访问真实豆瓣或未知影视源；公网请求只覆盖文档明确列出的 Apple Developer 测试流，以及 Internet Archive、Wikimedia、NASA、Library of Congress 等公开目录适配器。

在线原研究实验室：<https://yydshly.github.io/0821_githubcode_study/demos/moovie-video-playback/>

在线地址运行在 GitHub Pages 静态模式：五类样例、四站管线、内置合成 HLS、真实解码和同集换线可以直接运行。公开目录实时 API、Apple 外部 HLS 白名单代理、AppleCMS 故障/熔断与 HLS 传输探针需要下方的本地 4174 增强服务。页面会自动识别运行环境并明确显示这个边界。

## 演示内容

可以直接搜索并选择五类场景：

| 搜索示例 | 元数据来源 | 播放结果 |
| --- | --- | --- |
| `雾港档案` | 豆瓣命中 | 双线路失败换线 |
| `荒原来信` | 豆瓣无结果，TMDB 回退 | 单线路稳定播放 |
| `青石巷短剧` | 元数据均无，资源反向建档 | 待人工确认，禁止自动播放 |
| `孤岛样片` | 豆瓣命中 | 资源为零，明确不可播放 |
| `Apple Bip Bop` | Apple Developer 官方测试目录 | 实时请求官方外部 HLS 并播放 |

选择结果后，每一站同时给出来源、能力和效果：

1. 豆瓣样式的脱敏响应 → 内部规范 `Media`；
2. AppleCMS 样式的脱敏响应 → 统一 HLS 剧集候选；
3. 外部 ID / 标题年份 / 硬冲突 → 可解释匹配决策；
4. 同一 `MediaUnit` 的候选 → 质量排序、失败事件和进度保留换线。

其中两个可播放场景接入真实本地 HLS：`雾港档案` 的排序结果先指向会在中段返回 503 的线路 A，再指向健康线路 B；`荒原来信` 指向健康线路 D。第五个场景 `Apple Bip Bop` 指向 Apple Developer 官方外部 HLS 测试流。这些地址都写在 AppleCMS 形状的播放串中，必须经过同一套解析、身份匹配和候选排序，第四站才会把排序结果交给 Hls.js。`青石巷短剧` 和 `孤岛样片` 分别停在人工复核和无候选状态，不会启动媒体请求。

浏览器播放地址统一请求 `127.0.0.1:4174`。本地故障场景返回 FFmpeg 合成媒体；Apple 场景由 4174 服务实时请求 `devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/`。因为 Apple CDN 未向 localhost 返回 CORS，服务只对该固定域名与路径做代理并重写 HLS URI，不能转发任意 URL。

页面下方的“真实本地请求”实验会请求独立的 `127.0.0.1:4174` 假源，验证：

- AppleCMS 形状的 200、429、500、异常 JSON 和超时；
- 三次连续失败后的 `closed → open → half-open → closed` 熔断恢复；
- HLS 清单失败、清单成功但首分片失败，以及坏线路切换到健康线路。

其中 A/B 面板是传输探针：成功只表示 `.m3u8` 和首分片可以通过 HTTP 获取。C 面板是真实解码实验：使用固定上游提交内的 Hls.js 1.4.12 播放本地 FFmpeg 生成的 H.264/AAC HLS，并在中段分片 503 后保留进度切换到健康线路。

## 运行

从仓库根目录打开两个终端。

终端 1，启动静态页面：

```powershell
python -m http.server 4173 --bind 127.0.0.1 --directory projects/moovie-video-playback
```

终端 2，启动故障可控的本地假源：

```powershell
node projects/moovie-video-playback/lab/server/fault-lab-server.cjs --port 4174
```

打开：

```text
http://127.0.0.1:4173/lab/
```

页面中的“公开版权电影”会实时访问 Internet Archive、Wikimedia Commons、Library of Congress 和 NASA 官方 API。搜索 `Big Buck Bunny` 可直接播放 IA 的 MP4 或 Wikimedia 的 WebM；搜索 `Apollo 11` 可验证 NASA 视频及使用条件；选择 LOC 可观察“缺少逐条权利声明即禁播”。公开来源需要联网，原有本地 HLS 与故障实验仍可离线运行。完整来源边界见 [`SOURCE_PROVIDER_MATRIX.md`](./SOURCE_PROVIDER_MATRIX.md)。

## 测试

如需重新生成可解码测试片：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File lab/scripts/generate-hls-fixture.ps1
```

测试片是 12 秒 `testsrc2` 测试图和 440 Hz 正弦波，不含第三方内容。可用 FFprobe 检查：

```powershell
ffprobe -v error -show_entries format=duration -show_entries stream=codec_name,codec_type,width,height -of json lab/media/hls/index.m3u8
```

```powershell
node --check lab/fixtures.js
node --check lab/pipeline.js
node --check lab/fault-lab.js
node --check lab/fault-lab-ui.js
node --check lab/real-hls-player.js
node --check lab/public-catalog.js
node --check lab/server/public-catalog.cjs
node --check lab/server/fault-lab-server.cjs
node --check lab/app.js
node --test lab/tests/pipeline.test.cjs lab/tests/fault-lab.test.cjs lab/tests/public-catalog.test.cjs
```

浏览器验收使用工作区自带的 Playwright 运行：

```powershell
$env:CODEX_BUNDLED_NODE_MODULES='<workspace dependency node_modules>'
node lab/tests/browser-check.cjs
node lab/tests/public-browser-check.cjs
$env:MOOVIE_LAB_URL='http://127.0.0.1:4173/lab/?runtime=pages'
node lab/tests/pages-static-browser-check.cjs
```

测试覆盖：

- GitHub Pages 静态运行模式的边界提示、禁用态、桌面/手机布局与键盘路径；
- Pages 内置合成 HLS 的真实首帧、中段缺失分片、同集换线与进度恢复；

- 豆瓣字段到内部媒体的规范化；
- 六种常见季集标签；
- AppleCMS 多线路、多集和非 HLS 过滤；
- 精确 ID、标题层和年份冲突；
- 同集高置信度候选排序；
- 自动换线不跨 `media_unit_id` 并保留位置。
- 片名和来源场景关键词搜索；
- 豆瓣无结果时的 TMDB 回退；
- 资源反向建档的人工复核隔离；
- 元数据存在但资源为空的终止状态。
- 真实本地 HTTP 请求的成功、限流、服务器错误、异常 JSON 和超时分类；
- 熔断器的阻断、单次 half-open 探测和恢复；
- HLS 清单/分片分层故障和候选换线。
- Hls.js 清单解析、真实首帧、`currentTime` 推进；
- 中段 `fragLoadError`、线路 B 重建、seek 恢复和换线后继续播放；
- 搜索结果中的真实候选直接交给上方播放器：雾港真实换线、荒原稳定播放；
- 人工复核与无候选分支不产生 `/hls/decodable-*` 请求；
- Apple 官方主清单、嵌套清单和分片通过严格白名单代理真实请求；
- 外域引用和越出固定路径的代理请求被拒绝；
- MSE/Hls.js 不可用时保留可操作的传输探针回退。
- IA/Wikimedia 的开放许可白名单、NASA 有条件使用说明和 LOC 缺权利声明禁播；
- IA MP4、Wikimedia WebM、NASA MP4 的真实远程首帧与 `currentTime` 推进；
- 公开 Provider ID 白名单，未知 Provider 不能把网关变成任意代理。

## 文件

| 文件 | 作用 |
| --- | --- |
| `fixtures.js` | 四类脱敏业务场景和一个 Apple 官方外部测试场景 |
| `pipeline.js` | 与页面解耦、可在 Node 测试的核心管线 |
| `fault-lab.js` | 与页面解耦的请求分类、熔断和 HLS 传输探针 |
| `fault-lab-ui.js` | 本地故障实验的交互、状态和时间线 |
| `real-hls-player.js` | Hls.js 真实解码、事件采集和进度保留换线 |
| `server/fault-lab-server.cjs` | 零依赖假 AppleCMS、HLS 故障端点与 Apple 固定白名单代理 |
| `server/public-catalog.cjs` | 四个官方公开 API 适配器、许可闸门和统一结果模型 |
| `public-catalog.js` | 真实搜索、版权状态、MP4/WebM/HLS 播放交接 |
| `scripts/generate-hls-fixture.ps1` | 生成 12 秒本地 H.264/AAC HLS |
| `media/hls/` | 六分片合成测试媒体，不含第三方素材 |
| `app.js` | 搜索、场景选择、四站运行控制和真实播放会话交接 |
| `index.html`, `styles.css` | 可访问、响应式研究界面 |
| `tests/*.test.cjs` | 核心管线、熔断器和本地服务自动化测试 |
| `RESEARCH_CONTRACT.md` | 研究边界、验收项和覆盖清单 |
| `RESEARCH_RESULTS.md` | 每站来源/能力/效果以及浏览器证据 |
| `SOURCE_PROVIDER_MATRIX.md` | 原生来源审计、公开来源能力和待配置来源边界 |
| `evidence/` | 桌面、手机、主旅程真实播放和独立故障实验截图 |

## 解释边界

- 演示证明的是数据编排和状态机，不证明真实豆瓣接口长期稳定。
- 演示证明的是 AppleCMS 数据形状适配，不证明任何资源有授权或可用。
- C 面板已经验证本地 H.264/AAC VOD 的 Hls.js/MSE 解码和换线，但不代表任意外部 HLS 可播；生产仍需验证来源准入、CORS、MIME、加密、字幕、清晰度、自适应码率和多浏览器兼容性。
- Apple 场景证明一个官方公开多码率 HLS 能通过受限代理在 Chromium 播放；它不是影视搜索源，也不能证明未知 AppleCMS 资源合法、稳定或可播。
- 公开目录只自动放行明确许可或符合当前研究展示条件的条目；NASA、LOC 和任何开放许可作品仍需按具体使用场景复核第三方、商标、肖像、隐私及地域权利。
- 当前代理为研究用途，会在内存中处理响应；生产代理还需要响应大小、带宽、并发、缓存、DNS 重绑定和内容类型门禁。
- 分数和阈值复现上游思路，只是研究基线，不能直接作为生产参数。
