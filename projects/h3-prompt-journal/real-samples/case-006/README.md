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
| 最终输出 | 由使用者在外部 H3 调度；生成后可写入 `result-video.mp4` |

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

只有你把 H3 实际返回的 `result-video.mp4` 放回样例目录后，网页才会把该案例升级为“实测输出”。
