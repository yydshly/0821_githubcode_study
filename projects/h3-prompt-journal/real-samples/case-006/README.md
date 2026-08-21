# CASE 006 真实测试包：柠檬贴纸厨房喜剧

这不是模板占位，而是一套准备提交给 MiniMax H3 的固定实验输入。

## 固定输入

| 项目 | 值 |
| --- | --- |
| 模型 | `MiniMax-H3` |
| 模式 | Reference-to-Video (`reference_image`) |
| 分辨率 | `768P` |
| 时长 | `10` 秒 |
| 画幅 | `16:9` |
| Picture 1 | [`picture-1-lemon-sticker.png`](../../../../docs/demos/h3-prompt-journal/assets/case-006-real-test/picture-1-lemon-sticker.png) |
| 英文 Prompt | [`prompt.txt`](prompt.txt) |
| 中文 Prompt | [`prompt.zh.txt`](prompt.zh.txt) |
| 最终输出 | [`result-video.mp4`](../../../../docs/demos/h3-prompt-journal/assets/case-006-real-test/result-video.mp4) · 已由使用者在外部 H3 生成并于 2026-08-21 返回 |
| 输出封面 | [`result-poster.jpg`](../../../../docs/demos/h3-prompt-journal/assets/case-006-real-test/result-poster.jpg) · 从真实成片 1.0 秒处抽取，不使用输入图冒充输出画面 |

Picture 1 由 Codex 内置图像生成工具创建，尺寸为 `1254×1254`、RGBA，透明通道范围为 `0–255`，文件约 `890 KB`。角色为原创柠檬贴纸，不依赖外部版权人物；生成规格保存在 [`image-generation-spec.txt`](image-generation-spec.txt)。

## 外部调度方式

直接下载 Picture 1 和任一语言 Prompt，在你的外部 MiniMax H3 工作流中使用以下固定参数：`MiniMax-H3 / reference_image / 10 秒 / 768P / 16:9`。英文版更贴近官方写作规范，中文版用于理解、复核或中文工作流。

## 可选：使用仓库脚本调用

MiniMax H3 的 V2 API 需要 Pay-as-you-go API Key，并会消耗账户额度。不要把密钥写进仓库或聊天记录；只在本机环境变量中配置：

```powershell
$env:MINIMAX_API_KEY = "你的密钥"
python projects/h3-prompt-journal/real-samples/case-006/run_h3.py
```

脚本会：

1. 把本地 PNG 编码为 Data URL，并以 `reference_image` 提交。
2. 使用仓库中的固定 Prompt 创建 `10s / 768P / 16:9` 任务。
3. 轮询官方查询接口。
4. 成功后把真实输出下载到网页素材目录的 `result-video.mp4`。
5. 保存不含 API Key 的任务元数据，便于页面展示和复现。

在没有 `MINIMAX_API_KEY` 时，可先运行无费用校验：

```powershell
python projects/h3-prompt-journal/real-samples/case-006/run_h3.py --dry-run
```

## 返回结果核验

- 实际时长：`10.125s`
- 画面：`1344×768 / H.264 / 24fps`
- 声音：`AAC / 32kHz / stereo`；平均响度 `-29.0 dB`，峰值 `-0.2 dB`，未检测到超过 1 秒的 `-50 dB` 静音段
- 观察通过：倒盐、轻敲、喂食和倒下四个节点可辨认；贴纸保持明显平面媒介；MP4 含连续双声道音轨
- 观察偏差：盐罐附近仍生成了圆形盖子，违反“场景任何位置都不存在盖子”的封闭式否定

机器可读记录见 [`result-metadata.json`](result-metadata.json)。该成片证明方法部分有效，但不能作为“全部约束均成功”的证据。

演示页持续并列显示 Picture 1 与真实视频：播放视频不会移除输入图。后续案例返回成片时沿用同一输入证据保留规则。
