# 网页验收记录

## 可复现环境

```text
Start command: python -m http.server 8043 --directory docs
Canonical local URL: http://127.0.0.1:8043/demos/h3-prompt-journal/
Browser runner: agent-browser 0.27.0
Validation date: 2026-08-21 (Asia/Shanghai)
```

截图为临时浏览器证据，保存在工具的临时目录中，没有提交到产品仓库。

## 浏览器覆盖

| 表面 | 主题 | 检查 | 结果 |
| --- | --- | --- | --- |
| 1440×900 桌面 | 浅色 | 首屏、能力地图、完整生产表单、六段预览、操作栏、其余研究内容 | pass |
| 768×1024 平板 | 深色 + reduced-motion | 双列卡、三列案例选择、表单、媒体、页面宽度 | pass |
| 390×844 手机 | 浅色 | 单列案例、单列表单、参考职责、策略参数、约束、预览 | pass |
| 1440×900 桌面 | 浅色 | 中英切换、CASE 001 三图样例、参数、声音卡与操作按钮 | pass |
| 768×1024 平板 | 深色 | CASE 004 单列信息、三图职责、原生声音和输出占位 | pass |
| 390×844 手机 | 浅色 | CASE 003 单列参数、声音卡、按钮与三图横向素材带 | pass |
| 1440×1000 桌面 | 浅色 | CASE 006 结果审计、四个下载入口、原生视频播放器 | pass |
| 768×1024 平板 | 深色 | CASE 006 单列结果卡、播放器与主题对比度 | pass |
| 390×844 手机 | 深色 | CASE 006 元数据、审计卡、下载按钮与播放器 | pass |

三个视口的 `scrollWidth - innerWidth` 均为 `-15`（垂直滚动条宽度），不存在页面级横向溢出；Prompt 预览宽度未超过工作台容器。

## 交互与状态

- 六个案例均通过真实点击切换，默认数据均显示“可复制到 H3”，并输出官方顺序的六个段落。
- CASE 001 默认输出 `3,563` 字符；段落依次为 `subject_definitions`、`summary`、`retention_analysis`、`detailed_description`、`overall_soundscape`、`non_diegetic_music`。
- 把时长改为 `20` 后显示“时长必须是 4–15 秒”并禁用复制/下载；恢复 `15` 后重新就绪。
- 关闭 CASE 004 全部五项约束后显示“至少保留一项策略约束”；恢复一项后重新就绪。
- CASE 004 选择“高潮段”后，`subject_definitions` 不再包含 Picture 3，`retention_analysis` 增加 `Picture 3: weak_reference` 的有意移除说明。
- “复制 Prompt”返回“已复制完整 Prompt，可前往 H3 粘贴并上传对应参考图”。
- “下载 .txt”返回 `已下载 h3-prompt-case-004.txt`；“恢复模板”恢复默认分段、字段和五项约束。
- 深色主题模拟后 `document.documentElement.dataset.theme === "dark"`；主题标签同步显示“浅色”。
- 首次 Tab 聚焦“跳到主要内容”，位置为页面顶部；Enter 后 URL hash 为 `#main`。
- 方向键从 CASE 001 切换到 CASE 002，再用左方向键返回 CASE 001，焦点与选中态同步。
- `prefers-reduced-motion: reduce` 浏览器模拟结果为 `true`，页面存在对应降级样式。

## 双语与真实前置信息（revision 3 历史记录）

- 页面默认进入“中文理解版”；CASE 001 的主体、场景、动作、参考职责、策略参数、声景和六段 Prompt 均为中文。
- 点击或键盘 Enter 切换 `English · H3` 后，表单和预览同步切换为英文，`aria-pressed=true`；切回中文同样通过。
- 在英文版把主体改为 `EN TEST SUBJECT` 后，切换中文仍保留中文预设；返回英文仍保留英文编辑值，证明两版独立保存。恢复模板后两版均回到对应默认值。
- CASE 002–006 的中文默认态逐一真实点击，全部显示“可复制到 H3”。
- CASE 006 英文下载反馈为 `h3-prompt-case-006.en.txt`；中文复制反馈明确写明“中文理解版”。
- 真实样例图片在浏览器报告 `naturalWidth=1254`，三个下载地址分别指向 Picture 1、`prompt.en.txt`、`prompt.zh.txt`。
- CASE 006 本地输入为 `1254×1254 / RGBA / alpha 0–255 / 890,093 bytes`；API 运行器 dry-run 验证 Prompt `3170` 字符，未发送请求、未消耗额度。
- 桌面、平板和 390px 手机的新增区域均为 `scrollWidth - innerWidth = -15`，不存在本地化导致的页面级横向溢出。
- 浏览器未报告页面错误；错误覆盖层检查为 `OK`，正文非空检查为 `HAS_CONTENT`。

## 五套带声音的真实前置信息（revision 4）

- CASE 001–005 共渲染 5 张真实样例卡、11 张原创参考图、10 个中英文 Prompt 下载按钮和 5 张 `SOUND PLAN` 卡。
- 11 张图片全部在真实浏览器中加载：横图为 `1672×941`，竖图为 `941×1672`；本地 HTTP 逐个请求均为 `200`，不存在缺图。
- 五套英文样例 Prompt 与对应案例“恢复默认”后的英文模板逐字相等；五套中文版本同样逐字相等，解决了固定下载版与上方模板偏离的问题。
- 五套英文 Prompt 均包含 `Native stereo audio`，五套中文 Prompt 均包含“原生立体声”；英文长度分别为 `3680 / 3209 / 3597 / 3791 / 3788` 字符。
- 五套均保留六段结构：`subject_definitions`、`summary`、`retention_analysis`、`detailed_description`、`overall_soundscape`、`non_diegetic_music`。
- CASE 005 英文生产版同时包含三句普通话“大家好，我今天一定一次过关！”、“稳住——还有机会！”、“我只是下来降个温。”，并明确要求对白清楚且不得重叠。
- 真实点击 CASE 001 英文下载按钮后反馈为“已下载 CASE 001 英文生产版；请同时下载卡片中的全部 Picture。”；键盘聚焦 CASE 005 英文按钮并按 Enter 也得到对应成功反馈。
- “载入上方编辑器”真实点击后，CASE 004 的案例编号、标题、默认字段和中文原生声景同步载入。
- 1440px 浅色、768px 深色和 390px 浅色均为 `scrollWidth - innerWidth = -15`；桌面三图并排，平板单列，手机三图使用局部横向素材带而不造成页面级溢出。
- 错误覆盖层为 `false`，正文长度 `7419` 字符；图片懒加载、动态 Blob Prompt 下载和输出等待状态均可用。

## CASE 006 外部真实输出（revision 5）

- 返回文件 `video_1787289612484.mp4` 已作为原始 MP4 接入页面，没有用前端动画或占位内容代替。
- `ffprobe` 报告 `10.125s / 1344×768 / H.264 / 24fps`，文件大小 `1,329,029 bytes`；音轨为 `AAC / 32kHz / 2 channels / stereo`。
- 音量扫描为平均 `-29.0 dB`、峰值 `-0.2 dB`；以 `-50 dB` 为阈值时，没有持续超过 1 秒的静音段。
- 抽帧观察到倒盐、轻敲、喂食和倒下四个节点，平面贴纸观感仍可辨认；同时如实记录盐罐旁圆形盖子仍出现的约束偏差。
- Chromium 播放器报告 `duration=10.125`、`videoWidth=1344`、`videoHeight=768`、`readyState=4`、`controls=true`；静音自动化解码测试中播放进度从 `0` 推进至 `1.162466s`。
- 页面没有自动播放，避免浏览器自动播放策略把声音验证误导为静音；播放器默认 `volume=1`、`muted=false`，声音轨存在性另由 `ffprobe` 独立验证。
- 输入图、英文 Prompt、中文 Prompt、真实 MP4 四个下载地址均经本地 HTTP 请求返回 `200`；MP4 响应类型为 `video/mp4`，长度与源文件一致。
- 1440×1000 浅色、768×1024 深色和 390×844 深色三种视口的 `scrollWidth - clientWidth` 均为 `0`；手机端播放器渲染宽度 `291px`，没有页面级横向溢出。
- 结果区同时渲染“观察通过”和“观察偏差”，浏览器错误记录为空，框架错误覆盖层为 `false`。

## 媒体与回退

- 固定提交的视频成功加载元数据，浏览器报告时长 `36.152993s`。
- 页面明确记录 README 的 45 秒描述与附件约 36 秒之间的差异。
- 视频使用 `preload="metadata"`；旁边保留固定提交的直接链接，作为媒体失败时的可操作回退。

## 性能观察

本地静态服务的浏览器观测：

| 指标 | 结果 |
| --- | --- |
| TTFB | 1.9ms |
| FCP | 32ms |
| LCP | 32ms（h1） |
| CLS | 0 |

这些数值只证明本地静态页面的主要内容没有被外部视频阻塞，不代表 GitHub Pages 的公网性能保证。

## 工程检查

- `node --check docs/demos/h3-prompt-journal/app.js`：pass。
- Python 标准库 HTML parser：两个 Pages HTML 均可解析。
- 必需交付文件：全部存在。
- `git diff --check`：pass。
- 浏览器错误与控制台：未报告页面错误。
- 总展厅“进入实验台”链接：成功导航到 `/demos/h3-prompt-journal/`。

## 验收中修复的问题

1. `100vw` 把滚动条宽度算入深色全宽区，桌面产生 8px 横向溢出；改为只扩展绘制区域，复验通过。
2. 五张能力卡在平板双列布局中留下空格；最后一张改为占满整行，移动端仍为单列。
3. 页面最初沿用 README 的 45 秒说法；读取真实媒体元数据后改为明确标注附件约 36 秒及其证据差异。
4. 第一版生产表单只监听 `input` 事件，自动化选择 CASE 004 高潮段时界面值变化但生成状态未更新；补充 `change` 事件后，画幅和分段选择均即时重建 Prompt。

## 终审

设计契约中的生产工作台必需行已完成本地验收；远端 Pages 发布状态在对应 PR 和工作流中另行核验。
