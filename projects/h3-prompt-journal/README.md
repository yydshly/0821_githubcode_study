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

页面允许选择六个案例，观察它们如何从失败模式推导策略、参考职责、时间线和约束组合；打开或关闭约束后，会生成一份用于理解结构的提示词骨架并支持复制。

骨架是本研究页的教学性重组，不是上游原提示词全文，也不会调用 MiniMax H3。生产使用前应前往对应上游案例核对完整提示词，并在当前模型版本上重新测试。

## 来源

- 研究仓库快照：[`h3-prompt-journal@0c7b488`](https://github.com/LoveRain1997/h3-prompt-journal/tree/0c7b4882dad8a302c304fe9be40f0b8b1b098b26)
- 官方写作规范快照：[`MiniMax-H3@d21241f`](https://github.com/MiniMax-AI/MiniMax-H3/blob/d21241f0a4b3acbb34c97dae47fa417b7065e438/skills/h3-prompt-writing/SKILL.md)
- 配套反推工作流快照：[`video-to-h3-prompt@31bed0d`](https://github.com/LoveRain1997/video-to-h3-prompt/tree/31bed0dfd69157cd14894c555b23e3baf5f44b31)
