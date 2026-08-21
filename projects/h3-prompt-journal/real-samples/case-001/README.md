# CASE 001 · 三人物遮挡衔接长镜头

- 图片：`picture-1-subject-a-gallery.png`、`picture-2-subject-b.png`、`picture-3-subject-c.png`
- 参数：`MiniMax-H3 / Ref2VA / 15s / 768P / 16:9`
- 重点：Picture 1 是唯一环境来源；Picture 2/3 只锁定人物。通过真实身体前景遮挡衔接，禁止切镜、淡化、传送和身份融合。
- 声音：画廊底噪、空间脚步、布料近身掠过、低音量无歌词器乐；整段保持同一声学空间。

Prompt 从网页样例卡片下载，与上方设计器恢复默认后的 CASE 001 完全一致。

## 返回结果

- 原始成片：[`result-video.mp4`](../../../../docs/demos/h3-prompt-journal/assets/case-001-real-test/result-video.mp4)
- 输出封面：[`result-poster.jpg`](../../../../docs/demos/h3-prompt-journal/assets/case-001-real-test/result-poster.jpg)，从真实成片 `12.0s` 处抽取
- 媒体：`15.083s / 1344×768 / H.264 / 24fps / AAC 32kHz stereo`
- 通过：三人身份、服装和画廊空间基本保持；最终合影完成；没有检测到明显硬切
- 偏差：人物会在遮挡完成前提前入画；第二、第三人物缺少各自清楚的独立环绕；多人同框发生过早

### 归因判断

提示词设计有明显责任，但不能简单归结为“用了模板”。当前 Prompt 在 15 秒内同时要求三次完整环绕、两次遮挡衔接和最终合影，任务过载；同时没有规定三人站位、遮挡占画比例及下一人物允许出现的时间。建议下一轮改成三个约 `90°` 短弧线，每次交接要求肩膀或背部覆盖至少 `90%` 画面，未来人物在揭示点前完全位于画外，并把最后 4 秒单独留给拉远合影。

机器可读核验与诊断见 [`result-metadata.json`](result-metadata.json)。即使优化 Prompt，三身份、单镜头和两次精确遮挡仍属于高难组合，需要重复生成才能判断稳定性。
