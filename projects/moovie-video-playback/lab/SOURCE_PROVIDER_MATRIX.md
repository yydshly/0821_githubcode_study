# Moovie 来源审计与公开来源接入矩阵

## 上游 v4.0.0 原生支持什么

上游并没有内置“四个影视资源站”。源码固定提交 `8e15a52` 的实际能力如下：

| 类别 | 原生来源 | 作用 | 是否提供正片 |
| --- | --- | --- | --- |
| 视频资源 | 管理员配置的多个 AppleCMS v10 API | `videolist` 搜索、`detail` 详情、解析播放串 | 是，但项目不附带站点清单，也不证明授权 |
| 目录/评分 | 豆瓣 Web、Rexxar、RSS | 热门、建议、详情、评分、短评/兴趣与账号同步 | 否 |
| 目录补充 | TMDB | 海报/背景、详情、剧集季信息、热门回退 | 否；需要 Token |
| ID 映射 | Wikidata SPARQL、WMDB | 豆瓣 ID → IMDb ID | 否 |
| 弹幕 | 可配置的 DandanPlay 形状 API | `/api/v2/match`、`/api/v2/comment/{id}` | 否 |
| 播放器 | ArtPlayer + Hls.js | 解码和播放 HLS | 不是来源 |

源码证据：`cmd/web/main.go:180` 只实例化 `NewAppleCMSCrawler`；`internal/search/applecms.go:34,71` 只调用 AppleCMS 的 `ac=videolist` 与 `ac=detail`；`internal/playurl/parse.go:38` 只保留包含 `.m3u8` 的地址。豆瓣和 TMDB 的 Provider 分别在 `internal/catalog/douban.go` 与 `internal/catalog/tmdb.go`，二者属于目录层。

因此，“豆瓣是影视入口”并不准确：豆瓣是内容身份和评分入口；正片入口是管理员配置的 AppleCMS。豆瓣没有条目时，目录可以用 TMDB 或资源反向建档继续，但是否有正片仍取决于资源 Provider。

## 本研究已接入的公开来源

这里的“可接入”限定为：无需账号或 API Key、存在官方公开 API、能返回浏览器可播放媒体、并且能把逐条权利条件带进结果。它不是“互联网上所有免费视频网站”。

| Provider | API/协议 | 自动放行条件 | 播放格式 | 当前效果 |
| --- | --- | --- | --- | --- |
| Internet Archive | Advanced Search + Metadata API | 条目必须明确标记 PD、CC0、CC BY 或 CC BY-SA；实时读取条目元数据 | MP4 | 已搜索、核权、播放； canonical open-film ID 仅作检索兜底，许可仍实时获取 |
| Wikimedia Commons | MediaWiki `generator=search` + `imageinfo.extmetadata` | 文件级许可为 PD、CC0、CC BY 或 CC BY-SA | WebM | 已搜索、核权、署名、播放 |
| Library of Congress | loc.gov JSON + IIIF A/V | 只有逐条返回明确的 `public domain/no known restrictions/free to use` 才自动放行 | MP4/HLS | 已搜索；本轮样例 6 条均缺逐条声明，全部禁播并链接项目页 |
| NASA Image and Video Library | Search API + Asset manifest | 仅作为教育/信息与事实性研究展示；显示官方使用指南，不得暗示背书 | MP4 | 已搜索、显示条件、播放；第三方素材、标识、人物/宣传用途仍需复核 |
| Apple Developer HLS Example | 固定官方 HLS 示例路径 | 只允许 Apple 官方测试路径，不是影视目录 | HLS | 已真实播放；仅用于验证 HLS/CORS/代理，不属于电影来源 |

## 当前没有直接启用的合法来源

| 来源类型 | 为什么未直接启用 | 正确接法 |
| --- | --- | --- |
| YouTube/Vimeo 官方预告或开放影片 | 需要 API Key、平台嵌入条款和逐条频道/版权核验 | Provider 保存官方 video ID，前端使用官方 Embed，不抓取媒体 URL |
| TMDB Watch Providers | 只提供地区化“去哪里看”的可用性信息，不提供正片 | 作为跳转/可用性元数据，不当作播放源 |
| Plex/Jellyfin/Emby | 是用户自有媒体库，需要服务器地址与 Token | 用户配置的私有 Provider；只访问其授权媒体 |
| S3/R2/对象存储/CDN | 必须由项目方拥有或取得媒体授权 | 媒资入库时保存许可凭证、区域和到期日，再生成 HLS/MP4 |
| 任意 AppleCMS 站点 | 协议可接不等于内容合法 | 必须建立来源合同、域名白名单、下架流程和逐条权利台账后再启用 |

## 版权闸门

自动播放不是“API 返回 URL 就播放”，而是：

```text
官方 Provider 响应
→ 固定来源规范化
→ 逐条许可/使用条件判定
→ 浏览器格式判定
→ 可播放，或带原因禁播
```

开放许可也不消除署名、相同方式共享、商标、肖像、隐私、第三方内容和司法辖区差异。本实验是工程风控基线，不是最终法律意见。
