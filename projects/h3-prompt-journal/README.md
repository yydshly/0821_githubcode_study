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

CASE 006 的外部 H3 成片已于 2026-08-21 返回并接入页面：`10.125s / 1344×768 / H.264 / AAC stereo`。画面保留了 2D 贴纸身份和主要喜剧节点，但盐罐旁仍出现圆形盖子，因此页面同时展示成功项与约束偏差，不把单次结果包装成完全成功。

CASE 001 的三人物遮挡衔接成片也已返回：`15.083s / 1344×768 / H.264 / AAC stereo`。三人身份和统一画廊基本保持，但人物提前同框、第二与第三人物缺少独立环绕。研究记录把主要原因定位为 15 秒任务过载、遮挡约束未量化和站位路径缺失，同时保留“三身份 + 单镜头 + 两次精确遮挡”本身的模型能力边界。

CASE 003 的同一人物三姿态微型飞行成片已返回：`15.083s / 768×1344 / H.264 / AAC stereo`。身份、服装、姿态顺序和连续性均基本保持，但前 5 秒成为贴鞋与贴手的人体扫描，后约 4.6 秒人物长期停在英雄姿态，缺少能证明微型尺度的通道、障碍与强视差。研究结论支持用户的直观判断：这套默认模板解决了反幻灯片问题，却可能因为检查项过多而让审美效果弱于目标明确的自由提示词。

CASE 004 的多参考帆板时尚成片已返回：`15.083s / 768×1344 / H.264 / AAC stereo`。人物服装、橙色帆与青色板、低水位逆光摄影分别进入成片，说明参考职责分离在粗粒度上生效；但横杆出现环状变形，手、桅杆、板面和脚部的接触关系不稳定，且约 `3.92 / 9.67 / 12.71s` 存在镜头切换。页面将其判断为“参考架构有效、运动学欠约束”，没有把远景服装一致误写成脸部身份已经通过。

CASE 005 的水上闯关成片也已接入：`15.083s / 1344×768 / H.264 / AAC stereo`。多数剧情节点和三句普通话均出现，但滚筒与鱼骨节点被合并、侧面机关没有形成可读触发，约 11.9 秒从爬墙直接切到水花。页面保留这条 V1 失败证据，并另给一套尚待外部验证的 V2 中英双语 Prompt；V2 将剧情缩减为五段，锁定“机关启动 → 接触 → 失衡 → 入水”的不中断因果镜头，只对细小表演和观众反应放权。

真实输出区采用持久的“输入图 → 输出视频”对照：加入视频后不删除或隐藏原始 Picture，视频封面从真实成片抽取。后续多参考图案例也必须保留全部输入证据，窄屏只调整排列方式。

## 来源

- 研究仓库快照：[`h3-prompt-journal@0c7b488`](https://github.com/LoveRain1997/h3-prompt-journal/tree/0c7b4882dad8a302c304fe9be40f0b8b1b098b26)
- 官方写作规范快照：[`MiniMax-H3@d21241f`](https://github.com/MiniMax-AI/MiniMax-H3/blob/d21241f0a4b3acbb34c97dae47fa417b7065e438/skills/h3-prompt-writing/SKILL.md)
- 配套反推工作流快照：[`video-to-h3-prompt@31bed0d`](https://github.com/LoveRain1997/video-to-h3-prompt/tree/31bed0dfd69157cd14894c555b23e3baf5f44b31)
