# Moovie 来源资源配置研究归档

> 状态：`archived`
> 归档日期：2026-08-21
> 研究对象：[TwoThreeWang/Moovie](https://github.com/TwoThreeWang/Moovie)
> 固定上游提交：`8e15a52e1c7bb78d938837292faea3bc5de705a4`

## 最终结论

视频聚合平台的核心资产不是播放器、豆瓣评分或推荐界面，而是可持续运营的**来源资源配置体系**：知道有哪些来源、怎样查询、能够返回什么、当前是否可靠，以及同一内容是否存在足够多的备用来源。

```text
管理员配置的来源 + 系统内置的公开来源 + 自有/合作媒体库
                         │
                         ▼
             统一搜索、匹配、检测和排序
                         │
                         ▼
              MP4 / HLS / DASH / Embed
                         │
                         ▼
                 播放与失败自动换源
```

没有来源，系统就没有内容可以搜索；没有可靠性评估，搜索结果就不能稳定播放；没有丰富度，换源、推荐和长尾搜索都没有基础。

## 对 Moovie 的准确理解

Moovie 不是通用互联网视频搜索引擎。其资源主链是：管理员在后台配置多个 AppleCMS v10 兼容接口，系统按关键词并发查询这些接口，保存返回的影片和播放地址，再把结果与豆瓣/TMDB 元数据匹配。

```text
用户输入片名
    ↓
查询本地缓存
    ↓ 未命中或后台刷新
并发请求已启用 AppleCMS 源
    ↓
GET {source}?ac=videolist&pg=1&wd={keyword}
    ↓
按 source_key + vod_id 保存候选
    ↓ 用户选中
GET {source}?ac=detail&ids={vod_id}
    ↓
解析 vod_play_url 中的线路、剧集和 m3u8
    ↓
Hls.js 从外部媒体服务器/CDN加载媒体分片
```

因此各组件的角色是：

| 组件 | 实际作用 | 是否提供片源 |
| --- | --- | --- |
| 豆瓣/TMDB | 标题、年份、封面、评分、评论和身份匹配 | 否 |
| AppleCMS 接口 | 返回第三方影片、剧集和播放地址 | 是 |
| 自有/合作媒体库 | 返回可控的视频文件或流 | 是 |
| Hls.js/ArtPlayer | 消费播放地址并呈现视频 | 否 |
| CDN/P2P | 分发已经存在的媒体数据 | 否，不负责发现首个内容 |

## 来源体系

### 点播来源

| 来源类型 | 接入方式 | 典型输出 |
| --- | --- | --- |
| 管理员配置源 | AppleCMS、合作方 API、自定义适配器 | 影片、剧集、m3u8 |
| 公开目录源 | Internet Archive、Wikimedia、NASA、PeerTube | MP4、WebM、HLS、嵌入地址 |
| 平台官方接入 | YouTube/Vimeo 等官方 API 或 oEmbed | 官方嵌入播放器 |
| 自有媒体库 | 上传、转码、对象存储、媒体服务器 | HLS、DASH、MP4 |

### 直播来源

| 来源类型 | 接入方式 | 典型输出 |
| --- | --- | --- |
| 管理员配置直播 | 单条 HLS/DASH、M3U 频道表 | 频道和直播地址 |
| 官方直播平台 | 平台搜索 API、频道 API、官方嵌入 | 直播状态和嵌入地址 |
| 合作直播源 | 鉴权 API、节目单、签名地址 | 频道、EPG、临时播放地址 |
| 自建直播 | RTMP/SRT/WebRTC 输入，HLS/WebRTC 输出 | 自有直播流 |

“公开来源”在本文中表示存在公开可接入的目录、API 或嵌入机制，不等同于软件开源，也不自动承诺所有条目都具备相同使用条件。

## 统一来源契约

来源适配器不应把各平台原始字段直接泄漏到搜索、排序和播放器。建议统一输出：

```json
{
  "providerId": "internet_archive",
  "sourceItemId": "provider-internal-id",
  "mediaType": "vod",
  "title": "影片名称",
  "year": 2026,
  "season": 1,
  "episode": 3,
  "playMode": "hls",
  "playUrl": "https://media.example/master.m3u8",
  "sourcePage": "https://provider.example/item/123",
  "online": true,
  "lastVerifiedAt": "2026-08-21T00:00:00Z"
}
```

来源自身还需要保存：

- `provider_id`、显示名称和来源类型；
- API 基础地址和允许的请求方式；
- 鉴权引用，不在结果或日志中暴露密钥；
- 搜索、详情、剧集、直播和节目单能力；
- 超时、并发、限流、缓存和熔断策略；
- 最近探测时间、成功率和失败原因；
- 启用状态、运营备注和准入规则。

## 来源可靠性

搜索成功不等于播放成功。来源评估至少需要形成以下漏斗：

```text
搜索命中
  → 地址存在
  → 内容匹配
  → 清单/文件可访问
  → 首帧成功
  → 连续播放稳定
```

建议按来源持续记录：

| 指标 | 定义 |
| --- | --- |
| 搜索成功率 | 成功返回有效结构的请求 / 总请求 |
| 影片命中率 | 标准检索集中至少返回一个正确结果的关键词比例 |
| 匹配准确率 | 标题、年份、类型、季集正确的结果比例 |
| 可播放率 | 能取得首帧的候选 / 所有候选 |
| 连续播放率 | 在观察窗口内无致命错误的播放会话比例 |
| 首帧时间 | 用户选中到画面出现的时间 |
| 失效率 | 最近验证后已经不可访问的地址比例 |
| 恢复时间 | 来源故障后重新通过探针所需时间 |

## 来源丰富度

丰富度不能只统计接口数量或搜索返回条数。应关注：

- 标准电影、剧集、动漫、纪录片和直播频道的覆盖率；
- 去重后的独有影片数和独有频道数；
- 电视剧季集完整度；
- 同一规范媒体单元拥有的独立来源数量；
- 新影片、新剧集和直播状态的更新延迟；
- 长尾关键词的有效命中率；
- 不同语言、地区、年份和清晰度的覆盖分布。

平台的有效资源率可以定义为：

```text
有效资源率 = 匹配正确且可稳定播放的候选数 / 搜索返回候选总数
```

## 资源匹配与换源

来源丰富以后，必须解决“是不是同一内容”。推荐匹配层级：

1. 已人工确认的资源关联；
2. 豆瓣、IMDb、TMDB 等外部 ID；
3. 规范标题 + 年份 + 媒体类型；
4. 原名、别名、季、导演和演员的加权匹配；
5. 低置信度候选进入人工复核。

换源只能发生在同一个规范媒体单元内。例如电视剧第 3 集播放失败，只能在其他来源的同一季同一集之间切换，不能退回第 1 集或跳到同名影片。

## 研究演示与证据

本项目的 [`lab/`](./lab/) 已经验证：

- AppleCMS 形状的搜索、详情和播放串解析；
- 豆瓣/TMDB 样式元数据与资源身份匹配；
- 本地 HLS 的首帧、连续播放、分片故障与进度保留换线；
- Apple 官方外部 HLS 的真实清单和分片请求；
- Internet Archive、Wikimedia、NASA 和 Library of Congress 的公开目录搜索；
- MP4、WebM 和 HLS 的播放交接；
- 来源许可/使用状态门禁、未知来源拒绝和固定目标代理边界。

完整运行方法见 [`lab/README.md`](./lab/README.md)，来源能力矩阵见 [`lab/SOURCE_PROVIDER_MATRIX.md`](./lab/SOURCE_PROVIDER_MATRIX.md)，浏览器实测见 [`lab/RESEARCH_RESULTS.md`](./lab/RESEARCH_RESULTS.md)。

## 后续优先级

1. 建立点播源和直播源共用的来源注册中心；
2. 支持启用、停用、测试和审计管理员配置源；
3. 为每个来源建立独立适配器和统一结果模型；
4. 建立固定关键词与固定频道的批量探测集；
5. 记录搜索、首帧、连续播放和失效数据；
6. 按有效资源率、匹配置信度和播放健康度排序；
7. 在严格同集约束下完成自动换源；
8. 最后再扩展推荐、社区、弹幕和 P2P 分发。

## GitHub Pages 交付契约

> 2026-08-21 修订：最初只把重新整合的结论页发布到 Pages，导致原研究实验室虽然在 GitHub 源码中，却没有在线入口。修订后的交付同时保留两个独立页面：`moovie-video-playback/` 是原实验室，`moovie-source-research/` 是最终结论归档。Pages 无法运行 Node 4174，因此原实验室使用明确标识的静态模式承载样例管线和内置 HLS 换线，实时公共目录与故障网关仍通过本地增强模式复验。

```text
Entry mode: brief-led
Target user and context: 阅读研究结论的产品、研发和运营人员
Desired first impression: 一眼理解“来源决定平台能力”
Visual ambition: Editorial
Experience architecture: Editorial Flow
Information constraints: 结论 → 来源分类 → 技术链路 → 评价指标 → 路线
Operation constraints: 纯静态、键盘可访问、无后端依赖
State constraints: 静态阅读页；外部链接和仓库链接必须可辨识
Environment constraints: GitHub Pages；桌面与手机；浅色主题
Primary journey: 阅读核心结论并进入完整研究记录
Required artifacts: 本归档、Pages研究页、仓库与展厅入口
Autonomy authorization: 用户已明确要求归档、提交和远端部署
User-decision boundary: 不创建外部服务、不配置密钥、不伪造在线搜索能力
Observable completion criteria: 页面静态可加载、核心结论位于首屏、手机无横向溢出、链接可键盘访问、Pages工作流成功
```

| 交付项 | 证据 | 状态 |
| --- | --- | --- |
| 核心结论归档 | `ARCHIVE.md` | `pass` |
| 仓库研究索引 | 根 README 与 `projects/README.md`；提交 `653d6c6` | `pass` |
| Pages 静态研究页 | `docs/demos/moovie-source-research/`；HTTP 200 | `pass` |
| 桌面与手机阅读 | `lab/evidence/source-archive-desktop.png`、`source-archive-mobile.png`；1440/390 px 无横向溢出 | `pass` |
| 键盘与静态回退 | 首个焦点为 `#main` 跳转；无 JavaScript/后端依赖 | `pass` |
| GitHub 远端与 Pages | Actions `32487301303`；[公开归档页](https://yydshly.github.io/0821_githubcode_study/demos/moovie-source-research/) | `pass` |
