# 研究项目目录

`projects/` 保存各个研究对象的源码、实验和结论。每个项目应尽可能自包含，并通过自己的 README 让后来者能够复现实验。

## 当前项目

| 项目 | 状态 | 研究记录 | 在线演示 |
| --- | --- | --- | --- |
| H3 Prompt Journal | `archived` | [结项档案](h3-prompt-journal/ARCHIVE.md) · [能力分析](h3-prompt-journal/) | [归档演示](https://yydshly.github.io/0821_githubcode_study/demos/h3-prompt-journal/) |
| ZhuLink：RSS 与公共资讯社区 | `archived` | [案例分析](zhulink-community-aggregation/) | 暂无 |
| Moovie：视频与直播来源研究 | `archived` | [来源研究归档](moovie-video-playback/ARCHIVE.md) · [完整分析](moovie-video-playback/) | [原研究实验室](https://yydshly.github.io/0821_githubcode_study/demos/moovie-video-playback/) · [归档结论页](https://yydshly.github.io/0821_githubcode_study/demos/moovie-source-research/) |
| Architecture Map：交互式项目架构地图 | `validated` | [研究记录](architecture-map/) · [扩展方向](architecture-map/EXTENSIONS.md) | [独立实现演示](https://yydshly.github.io/0821_githubcode_study/demos/architecture-map/) |
| Public APIs Intelligence：公共 API 能力账本 | `archived` | [归档档案](public-apis-intelligence/ARCHIVE.md) · [研究记录](public-apis-intelligence/) | [归档演示](https://yydshly.github.io/0821_githubcode_study/demos/public-apis-intelligence/) |

## 推荐布局

```text
projects/<project-slug>/
├─ README.md       # 项目来源、研究目标、运行方式与结论
├─ NOTES.md        # 按时间追加的实验日志
├─ src/            # 最小复现或实现代码（按需）
├─ tests/          # 验证代码（按需）
└─ assets/         # 小型截图或图表（按需）
```

从 [`_template/`](_template/) 复制起步模板，删除不适用的段落即可。
