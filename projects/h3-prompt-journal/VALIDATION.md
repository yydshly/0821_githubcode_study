# 网页验收记录

## 可复现环境

```text
Start command: python -m http.server 8041 --directory docs
Canonical local URL: http://127.0.0.1:8041/demos/h3-prompt-journal/
Browser runner: agent-browser 0.27.0
Validation date: 2026-08-21 (Asia/Shanghai)
```

截图为临时浏览器证据，保存在工具的临时目录中，没有提交到产品仓库。

## 浏览器覆盖

| 表面 | 主题 | 检查 | 结果 |
| --- | --- | --- | --- |
| 1440×900 桌面 | 浅色 | 首屏、能力地图、实验台、媒体、场景、审计、路线图、来源 | pass |
| 768×1024 平板 | 深色 | 双列卡、三列案例选择、实验台、媒体、页面宽度 | pass |
| 390×844 手机 | 浅色 | 单列案例、约束、代码预览、视频、路线图、页脚 | pass |

三个视口均满足 `scrollWidth <= clientWidth`；代码预览宽度未超过组合器容器。

## 交互与状态

- 六个案例均能切换并渲染各自标题、参考职责、时间线、约束与骨架。
- 使用真实点击从 CASE 004 切换到 CASE 005；方向键从 CASE 004 切换到 CASE 005，焦点保留在选中项。
- 关闭 CASE 004 的“高潮移除摄影图”后，对应约束从 Prompt 预览消失。
- “复制骨架”返回“已复制提示词骨架”。
- 主题成功从深色切到浅色，`aria-pressed` 与标签同步。
- 首次 Tab 聚焦“跳到主要内容”，位置为页面顶部；Enter 后 URL hash 为 `#main`。
- 案例按钮焦点轮廓为 `solid 3px`。
- `prefers-reduced-motion: reduce` 浏览器模拟为 true，页面存在对应降级样式。

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

## 终审

设计契约中的必需行全部为 `pass`，没有剩余 `continue`、`defer` 或 `blocked`。本地交付闭环已完成；远端 Pages 发布状态在对应 PR 和工作流中另行核验。
