# 面向我们的最小能力设计

## 目标和边界

目标是实现“可解释地找到同一影视内容的多条合法播放线路，并在失败时安全换线”。第一阶段不做复杂推荐、评论社区、弹幕、全量豆瓣同步、深度数据库优化和自动化部署。

三个不可破坏的边界：

1. 元数据提供方和视频资源提供方完全解耦；豆瓣不可用不能让已知地址停止播放。
2. 自动换线只能在同一个 `MediaUnit` 内发生；匹配不确定时宁可人工选，也不能播错片或错集。
3. 资源接入必须有来源准入和授权记录；“接口可访问”不是版权依据。

## 建议模块

```go
type MetadataProvider interface {
    Search(ctx context.Context, query string) ([]MediaCandidate, error)
    Detail(ctx context.Context, externalID string) (MediaMetadata, error)
    Reviews(ctx context.Context, externalID string) ([]Review, error)
}

type ResourceProvider interface {
    Search(ctx context.Context, query ResourceQuery) ([]ExternalResource, error)
    Detail(ctx context.Context, resourceID string) (ExternalResource, error)
}

type MediaMatcher interface {
    Match(resource ExternalResource, media Media) MatchDecision
}

type CandidateService interface {
    Candidates(ctx context.Context, unitID string) ([]PlaybackCandidate, error)
}

type PlaybackTelemetry interface {
    Record(ctx context.Context, event PlaybackEvent) error
}
```

各模块只交换内部 DTO，不暴露豆瓣或 AppleCMS 的原始响应。这样可以替换提供方、测试异常情况，也能将合法自有内容与第三方适配器放在同一候选框架下。

## 最小领域对象

无需先研究复杂数据库，只需要明确四类记录：

| 对象 | 必要字段 | 作用 |
| --- | --- | --- |
| `Media` | `id, type, title, year, season, external_ids` | 规范影视身份 |
| `MediaUnit` | `id, media_id, season, episode_key` | 影片本身或某一集，是换线边界 |
| `ResourceCandidate` | `id, unit_id, provider, resource_id, line_key, url, format, match_confidence, evidence` | 外部播放候选 |
| `PlaybackQuality` | `candidate_id, attempts, successes, failures, avg_first_frame_ms, updated_at` | 线路质量统计 |

此外为资源提供方保存 `enabled`、`authorization_status`、`allowed_domains`、`timeout` 和熔断状态；不用一开始设计复杂关系模型。

## 匹配决策

按证据强弱依次执行：

```text
人工确认关联
  > 豆瓣/IMDb/TMDB 等稳定外部 ID 相等
  > 标题 + 年份 + 类型 + 季精确相等
  > 别名和主创等启发式评分
  > 人工复核 / 拒绝
```

建议输出的不是单个浮点数，而是：

```json
{
  "decision": "auto_accept | review | reject",
  "confidence": 0.93,
  "algorithm_version": "matcher-v1",
  "evidence": ["douban_id_equal", "year_equal", "season_equal"],
  "conflicts": []
}
```

MVP 可设 `auto_accept >= 0.95`、`review >= 0.75`，但外部 ID 精确相等仍应检查媒体类型和季是否冲突。Moovie 的 0.88/0.90 阈值只能作为实验起点，不能直接视为生产标准。

## 播放候选与换线

候选查询接口建议为：

```http
GET /api/media-units/{unit_id}/playback-candidates
```

响应只返回该单元的候选，并包含短时有效的播放地址、格式、匹配置信度、质量分和 `candidate_session_id`。服务端必须再次校验 `unit_id`，客户端不能仅靠显示标题判断同一集。

排序建议沿用“内容正确性先过滤、播放质量再排序”：

```text
硬过滤：同 unit_id + 来源启用 + URL 有效 + confidence 达标
健康度：成功率后验 × 样本置信度，兼顾首帧速度
最终排序：健康度为主，匹配置信度为辅，必要时加入来源运营权重
```

客户端换线状态机：

```text
开始候选 A
  ├─ 首帧成功并播放 10 秒 ── 记录成功
  └─ 超时/致命错误
        ├─ 本会话换线次数 < 2
        │    └─ 请求同 unit 候选，排除已失败项，切换到 B 并恢复进度
        └─ 无安全候选 ── 停止自动行为，展示人工线路和错误原因
```

同一 `attempt_id` 的终态事件要幂等；`candidate_session_id` 用于串起一次页面会话内的多次换线，防止重复上报污染健康度。

## 资源适配器要求

AppleCMS 只应是第一种适配器，不应成为内部模型：

- 所有请求有单源超时、总预算、并发上限和熔断；
- URL 解析后再做公网/域名校验，重定向每一跳重复校验；
- 内容长度有限制，响应结构严格校验；
- 播放 URL 不长期明文缓存，日志脱敏；
- 每个来源有授权状态、负责人、准入日期和停用开关；
- 支持 HLS 时校验 master/media playlist，而不是只看字符串中是否含 `.m3u8`；
- MVP 只承诺 HLS，FLV/MP4 等资源适配器真正打通后再声明支持。

## API 最小集

```text
GET  /api/catalog/search?q=...
GET  /api/catalog/media/{media_id}
POST /api/resources/search                 # 后台或受控触发
GET  /api/media-units/{unit_id}/playback-candidates
POST /api/playback/events
POST /api/resource-links/{id}/confirm      # 人工确认/纠错
```

豆瓣短评属于详情展示接口的可选数据。短评失败返回空列表，不影响候选线路接口。

## 分阶段实现

### 阶段 1：正确播放

- 一个元数据适配器、一个已授权资源适配器；
- 规范 `Media` / `MediaUnit`；
- HLS 播放；
- 人工确认资源映射；
- 播放失败后手工换线。

验收：选定某电视剧第 N 集时，所有可选线路均可证明属于同一季同一集；元数据源不可用时，已缓存内容仍可播放。

### 阶段 2：自动匹配和质量闭环

- 精确 ID 匹配和可解释的启发式匹配；
- 首帧、播放 10 秒、卡顿、失败等幂等事件；
- 贝叶斯平滑的线路健康度；
- 最多两次同集自动换线。

验收：注入线路超时后，播放器切换到同集候选并恢复进度；无法确认同集时停止自动切换；冷启动候选不会因一次成功就永久排到第一。

### 阶段 3：运营可控

- 来源准入、停用、熔断和健康面板；
- 匹配复核队列和人工纠错；
- 按来源、格式、地区和设备观察成功率；
- 基于真实数据校准阈值。

验收：可以在不发版的情况下停用问题来源，并能追溯每次自动匹配和换线的证据。

## 不建议照搬的地方

- 不直接依赖豆瓣未公开接口作为同步请求的单点。
- 不将 URL 包含 `.m3u8` 当作资源有效性校验。
- 不直接使用 Moovie 的评分权重和阈值作为生产结论。
- 不把前端 CDN 的 `latest` 版本用于可重复生产构建，应固定版本并做供应链校验。
- 不在许可证不明时复制上游实现代码。
