# Moovie 视频资源与播放链路研究

> 研究对象：[TwoThreeWang/Moovie](https://github.com/TwoThreeWang/Moovie)
> 固定版本：`8e15a52e1c7bb78d938837292faea3bc5de705a4`
> 上游代码：[`upstream/`](./upstream/)；本轮重点：[`upstream/v4.0.0/`](./upstream/v4.0.0/)
> 研究日期：2026-08-21

## 结论

**归档结论：这个方向的核心技术要点是来源资源配置。** 播放器、豆瓣评分和推荐都建立在来源供给之上；平台真正需要持续建设的是点播源与直播源的接入、可靠性评估、丰富度衡量、内容匹配和失败换源。完整结论见 [`ARCHIVE.md`](./ARCHIVE.md)。

Moovie 对我们开发视频播放网站有研究价值，但价值不是“免费片库”，也不只是“豆瓣评论 + 搬运视频”。它提供了一套较完整的聚合播放编排思路：

1. 用豆瓣信息建立用户可理解的影视目录和规范媒体身份。
2. 从管理员配置的 AppleCMS v10 接口搜索第三方资源。
3. 把来源各异的影片、季、集和线路匹配到同一个规范媒体单元。
4. 在同一集范围内根据历史成功率、首帧速度和匹配置信度排序线路。
5. 播放失败后自动切换候选线路，并将结果反馈给后续排序。

它不生产、不托管视频，也不会自动发现合法片源。外部资源是否免费、稳定、可商用和有版权授权，不能由这个项目保证。对我们而言，应该研究并重写它的“身份解析、候选排序、失败换线、质量闭环”，不应把未知第三方片源当作产品资产。

## 可运行研究演示

可搜索的核心纵向实验已经完成：[`lab/`](./lab/) 可以搜索五类样例并逐站运行“元数据 → AppleCMS 形状资源 → 身份匹配 → 真实播放”。第三轮增加本地 HTTP/HLS 故障；第四轮验证真实解码；第五轮把排序候选直接交给上方播放器；第六轮新增 Apple Developer 官方 `Bip Bop` 外部 HLS，通过固定域名与路径白名单代理验证真实公网清单、首帧和连续播放。仍不访问真实豆瓣或未知影视源。

- [运行说明](./lab/README.md)
- [第六轮官方外部 HLS 研究结果](./lab/RESEARCH_RESULTS.md)
- [研究契约与验收清单](./lab/RESEARCH_CONTRACT.md)
- [桌面搜索完成态截图](./lab/evidence/desktop-search-complete.png)
- [搜索场景真实 HLS 完成态截图](./lab/evidence/scenario-real-hls-complete.png)
- [Apple 官方外部 HLS 完成态截图](./lab/evidence/external-apple-hls-complete.png)
- [手机完成态截图](./lab/evidence/mobile-dark-complete.png)
- [本地故障实验截图](./lab/evidence/fault-lab-complete.png)
- [真实 HLS 换线截图](./lab/evidence/real-hls-failover-complete.png)

## 研究范围

本轮只覆盖四条主链：

- 豆瓣元数据与评论获取；
- AppleCMS 视频资源获取；
- 浏览器播放能力；
- 资源匹配、线路排序和失败换线。

数据库只讨论这些能力必需的最小领域对象；部署、推荐算法、社区、AI、弹幕等不深入。

## 核心链路

```text
豆瓣检索/详情/短评
        │
        ▼
规范媒体 Media ────── 影视标题、年份、类型、季、外部 ID
        │
        ├── AppleCMS 多源并发搜索 ── Resource（source + vod_id）
        │                               │
        │                               ▼
        └──────── 身份匹配 ◀──── 播放串解析、季集归一化
                                        │
                                        ▼
                          同一 MediaUnit 的候选线路
                                        │
                           健康度 + 匹配置信度排序
                                        │
                                        ▼
                           ArtPlayer / Hls.js 播放
                                        │
                           首帧、10 秒、卡顿、失败事件
                                        │
                                        └── 回流质量排序与自动换线
```

## 1. 豆瓣承担什么角色

豆瓣在这里是元数据、用户兴趣和评论提供方，不是视频提供方。

| 能力 | 上游请求 | 用途 |
| --- | --- | --- |
| 热门列表 | `/j/search_subjects` | 首页目录和发现 |
| 搜索建议 | `/j/subject_suggest` | 片名检索 |
| 影视详情 | `/rexxar/api/v2/{movie|tv|show}/{id}` | 标题、年份、类型、简介、封面、主创、评分 |
| 热门短评 | `/rexxar/api/v2/.../{id}/interests` | 内容展示 |
| 用户兴趣 | `/rexxar/api/v2/user/{id}/interests` | 想看、在看、看过同步 |
| 用户动态 | `/feed/people/{id}/interests` | 增量同步 |

上游实现了 200 ms 全局请求间隔、相同请求合并、缓存、429 暂停，以及部分本地回退。这说明作者也把豆瓣视为不稳定的外部依赖。

对我们的设计启示：

- 定义 `MetadataProvider` 接口，不让页面和业务逻辑直接依赖豆瓣 URL。
- 豆瓣 ID 是很强的匹配证据，但不能成为唯一主键；内部 `media_id` 才是稳定身份。
- 详情和评论应缓存并异步刷新；豆瓣暂时不可用不应阻断已有资源播放。
- 这些 Web/Rexxar/RSS 地址不是可承诺稳定性的正式业务 API。正式产品还需核实使用条款、访问频率和数据展示授权，并准备 TMDB 等替代源。

代码证据：[`internal/catalog/douban.go`](./upstream/v4.0.0/internal/catalog/douban.go)、[`internal/douban/client.go`](./upstream/v4.0.0/internal/douban/client.go)。

## 2. 视频资源如何获取

Moovie 没有搜索互联网，也没有抓取视频网站页面。管理员先配置若干 AppleCMS v10 API，然后系统调用：

```text
GET {source_api}?ac=videolist&pg=1&wd={keyword}
GET {source_api}?ac=detail&ids={vod_id}
```

返回结果被统一为 `source_key + vod_id + 标题/年份/类型 + vod_play_url`。搜索会先查本地结果，再以默认 6 路并发请求外部源；单源默认超时 10 秒，总搜索默认 30 秒。连续 3 次超时或错误的源会熔断 5 分钟，再用一次探测请求尝试恢复。

重要边界：

- 资源源必须由运营配置，项目本身不提供免费片源清单。
- AppleCMS 返回“接口结果”不等于内容已获授权，也不代表 URL 可跨域、可播放或长期有效。
- 上游对源地址和重定向目标做公网校验，并限制响应体为 4 MiB，值得保留；生产实现仍需要 DNS 重绑定防护、出口隔离和域名白名单。
- 播放串以 `$$$` 分线路、`#` 分集、`$` 分标题和地址。
- AppleCMS 解析器当前只保留 URL 中包含 `.m3u8` 的条目，所以标准资源聚合主链实际是 HLS-only。

代码证据：[`internal/search/applecms.go`](./upstream/v4.0.0/internal/search/applecms.go)、[`internal/search/service.go`](./upstream/v4.0.0/internal/search/service.go)、[`internal/search/health.go`](./upstream/v4.0.0/internal/search/health.go)、[`internal/playurl/parse.go`](./upstream/v4.0.0/internal/playurl/parse.go)。

## 3. 播放能力

浏览器端使用 ArtPlayer；HLS 由 Hls.js 处理，FLV 由 flv.js 处理，MP4 交给浏览器原生 `<video>`。因此“手工输入播放地址”的播放器层确实支持 HLS、FLV 和 MP4。

但应区分两层能力：

| 场景 | HLS/M3U8 | FLV | MP4 |
| --- | --- | --- | --- |
| 手工传入播放器 | 支持 | 支持 | 支持，依赖浏览器编码能力 |
| AppleCMS 聚合主链 | 支持 | 解析时被过滤 | 解析时被过滤 |

播放器记录 `attempt_started`、`manifest_loaded`、`first_frame`、`played_10s`、`rebuffer`、`fatal_error`、`source_switched`、`ended`、`abandoned` 等事件。相比仅根据 HTTP 200 判定资源健康，这些事件更接近用户真实播放结果。

代码证据：[`web/static/js/player.js`](./upstream/v4.0.0/web/static/js/player.js)、[`web/templates/pages/play.html`](./upstream/v4.0.0/web/templates/pages/play.html)、[`internal/playback/handler.go`](./upstream/v4.0.0/internal/playback/handler.go)。

## 4. 资源匹配与换路线

### 媒体匹配

上游不是简单按片名相等合并，而是分层判断：

1. 已人工确认的资源关联；
2. 豆瓣 ID 精确相等；
3. IMDb/TMDB ID 精确相等；
4. 标题 + 年份 + 类型精确相等；
5. 标题、年份、类型、季、主创、原名加权评分；
6. 低置信度结果进入复核，不自动合并。

启发式评分权重为标题 0.40、年份 0.15、媒体类型 0.10、季 0.15、主创 0.10、原名 0.10。年份差超过 1、媒体类型冲突或季冲突会直接拒绝。

这个思路值得采用，但权重本身不是通用真理。中文别名、翻拍作品、同名短剧和分季方式差异都会制造误匹配。我们的实现应保存匹配证据、算法版本和人工覆盖，不只保存一个最终分数。

代码证据：[`internal/search/service.go`](./upstream/v4.0.0/internal/search/service.go)、[`internal/mediaidentity/match_score.go`](./upstream/v4.0.0/internal/mediaidentity/match_score.go)。

### 季集归一化

上游可识别 `S01E03`、`第1季第3集`、`第3集`、`EP3`、`E3` 和合理范围内的纯数字，统一为例如 `season=1, episode_key=S01E03`。无法识别的标签会保留，不会错误地回退到第 1 集。

这是自动换线的前置条件：换线必须发生在同一个规范 `MediaUnit` 内，绝不能因为地址失败而从第 3 集跳到第 1 集或另一季。

代码证据：[`internal/mediaidentity/episode.go`](./upstream/v4.0.0/internal/mediaidentity/episode.go)、[`internal/mediaidentity/resource_parse.go`](./upstream/v4.0.0/internal/mediaidentity/resource_parse.go)。

### 候选排序和自动换线

同集候选的最终分数为：

```text
candidate_score = 0.85 × playback_health + 0.15 × mapping_confidence
```

`playback_health` 以成功/失败次数的 Beta(2,2) 后验估计可靠性，并用样本量逐步增加信任；再按 80% 可靠性 + 20% 首帧速度合成。无历史数据时不会被误判为满分健康。

浏览器每次播放最多自动换线 2 次；只选择同一个 `media_unit_id`、未在本会话失败、地址非空且匹配置信度至少 0.90 的候选。切换后尽量恢复原播放进度；没有安全候选时展示手动线路，而不是盲目跳转。

这部分是本项目最值得借鉴的设计：

- 匹配置信度回答“是不是同一内容”；
- 播放健康度回答“这条线路现在好不好用”；
- 两者必须分开建模；
- 换线范围必须先由媒体身份约束，再由质量排序；
- 真实客户端播放事件应回流形成闭环。

代码证据：[`internal/playback/health.go`](./upstream/v4.0.0/internal/playback/health.go)、[`internal/mediaidentity/store.go`](./upstream/v4.0.0/internal/mediaidentity/store.go)、[`web/static/js/player.js`](./upstream/v4.0.0/web/static/js/player.js)。

## 对我们的建议

不建议直接把 Moovie 当生产系统二次开发；建议把它当“参考实现”，按 [`DESIGN.md`](./DESIGN.md) 重建最小链路。优先级是：

1. 先建立内部规范媒体和季集身份；
2. 接一个合法、可控的元数据提供方和一个明确授权的资源提供方；
3. 打通 HLS 播放及真实质量事件；
4. 再做严格同集候选、人工确认和自动换线；
5. 有真实数据后再调整阈值和评分权重。

如果只复制页面播放器，研究价值很低；如果吸收“内容身份层 + 资源适配层 + 播放质量闭环”的分层，研究价值较高。

## 法律与工程限制

- 截至固定提交，上游仓库未提供 `LICENSE` 文件。公开可见不等于获得复制、修改、分发或商用许可。本子模块仅作为研究证据；正式复用代码前需获得作者许可或只重写思想与接口。
- 豆瓣数据接口和第三方 AppleCMS 资源都存在条款、版权、稳定性和限流风险。
- “免费访问”只表示请求时可能不收费，不等于内容免费授权、API 永久免费或运营成本为零。
- 资源源的广告、恶意内容、CORS、证书、带宽和地区限制都可能导致播放失败，必须建立内容审核和来源准入。

## 获取与更新

首次拉取本研究仓库后执行：

```powershell
git submodule update --init --recursive
```

本项目故意固定上游提交，避免分析结论随上游默认分支静默变化。需要升级时，应先重新审查上述四条链路，再更新 submodule 指针和本文版本号。
