# H3 Prompt Journal 能力研究

> 研究对象：[LoveRain1997/h3-prompt-journal](https://github.com/LoveRain1997/h3-prompt-journal)；快照提交：[`0c7b488`](https://github.com/LoveRain1997/h3-prompt-journal/tree/0c7b4882dad8a302c304fe9be40f0b8b1b098b26)。

## 元信息

| 字段 | 内容 |
| --- | --- |
| 状态 | `validated` |
| 研究日期 | 2026-08-21 |
| 上游许可证 | MIT |
| 上游形态 | 6 个案例的 Markdown 经验日志，包含提示词与部分媒体资产 |
| 在线演示 | [H3 Prompt Journal 研究实验台](../../docs/demos/h3-prompt-journal/) |
| 本地实现 | 纯静态 HTML / CSS / JavaScript，无 API、无密钥、无构建依赖 |

## 一句话结论

这个仓库不是自动提示词生成器，而是一套以失败模式为入口的 **H3 提示词工程案例库**。它最有价值的能力，是把“更快、更连贯、更像真人、更有喜剧感”等模糊意图，改写成参考图职责、物理路径、时间锚点、数字比例、负面约束以及明确的模型自由度。

真正承担“视频反推 H3 提示词”自动化工作的，是作者同时链接的 [`video-to-h3-prompt`](https://github.com/LoveRain1997/video-to-h3-prompt)；官方 [`h3-prompt-writing`](https://github.com/MiniMax-AI/MiniMax-H3/tree/main/skills/h3-prompt-writing) 则提供模式与字段结构。三者更像：

```text
官方写作规范 → 生成 / 反推工作流 → 案例结果与经验日志
h3-prompt-writing   video-to-h3-prompt   h3-prompt-journal
```

## 本研究交付

- [`ANALYSIS.md`](ANALYSIS.md)：能力模型、六案例对照、证据边界、场景与扩展路线。
- [`DESIGN.md`](DESIGN.md)：网页设计契约与验收覆盖清单。
- [`VALIDATION.md`](VALIDATION.md)：静态检查和浏览器验收记录。
- [`docs/demos/h3-prompt-journal/`](../../docs/demos/h3-prompt-journal/)：可交互网页实验台。

## 使用演示页

页面把六个案例转化为六种可编辑策略模板。选择模板后，可以在“中文理解版”和“英文生产版”之间切换，分别修改主体、场景、目标动作、视觉风格、4–15 秒时长、画幅、参考图职责、策略专属参数与声音设计；两版都会按官方顺序生成 `subject_definitions`、`summary`、`retention_analysis`、`detailed_description`、`overall_soundscape`、`non_diegetic_music` 六段式 Prompt，并支持校验、复制、下载和恢复模板。

生成器是本研究基于上游经验与官方结构做的参数化重组，不是上游 Prompt 原文。它只在浏览器本地处理文本，不上传素材，也不调用 MiniMax H3。使用时仍需在 H3 中按 `Picture 1/2/3` 顺序上传对应参考图，并根据实际模型结果迭代。

页面另提供 CASE 001–005 的五套真实前置信息：Codex 内置 ImageGen 生成的 11 张原创参考图、与上方默认模板完全一致的动态双语 Prompt、`MiniMax-H3 / Ref2VA / 12–15s / 768P` 参数，以及逐套原生立体声方案。最终视频由使用者在外部 H3 调度；在 MP4 返回前，页面明确显示“等待外部生成”，不把输入包冒充成实测结果。完整素材说明见 [`real-samples/`](real-samples/README.md)。

## 来源

- 研究仓库快照：[`h3-prompt-journal@0c7b488`](https://github.com/LoveRain1997/h3-prompt-journal/tree/0c7b4882dad8a302c304fe9be40f0b8b1b098b26)
- 官方写作规范快照：[`MiniMax-H3@d21241f`](https://github.com/MiniMax-AI/MiniMax-H3/blob/d21241f0a4b3acbb34c97dae47fa417b7065e438/skills/h3-prompt-writing/SKILL.md)
- 配套反推工作流快照：[`video-to-h3-prompt@31bed0d`](https://github.com/LoveRain1997/video-to-h3-prompt/tree/31bed0dfd69157cd14894c555b23e3baf5f44b31)
