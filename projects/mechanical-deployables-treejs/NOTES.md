# 实验日志

## 2026-08-22 · 展示体验 R2

### 问题

首版 fleet lab 只证明多实例场景与性能增长，没有直接展示原作，也没有解释技术因果或形成产品故事。

### 改动

- 增加原作 iframe 入口，直接运行固定上游 Gallery；
- 增加 watchtower 七步技术解剖，以真实 clip 时间控制姿态和目标包围框；
- 增加“极夜前哨”六章导演，将 dish、bridge、watchtower 和两台 sentry 组织为产品因果链；
- 增加桌面/移动 Spatial Stage、键盘路径、reduced-motion 与可读 fallback；
- 扩充 Playwright 覆盖并修复测试静态服务器缺少 CSS MIME 的问题。

### 结论

场景扩展成故事需要“原因—动作—结果”的不可交换节拍；故事扩展成产品还需要真实操作、权威状态和任务闭环。当前完成故事型产品原型，不把它误报为完整游戏产品。

## 2026-08-22

### 假设

上游的核心价值是可检查的机械动画 contract；如果直接扩展到大型游戏，最先暴露的问题会是多 Rig 生命周期和零件级 draw call，而不是单体三角形数。

### 操作

- 以 Git 子模块固定上游提交 `f9d757d3`；
- 检查入口、renderer、scene、camera、controls、模型、材质、声音、wreck 与四类 audit；
- 用 Playwright 运行全部 11 个模型并采集运行时规模；
- 实现 FleetScheduler 和 1/4/9/16/25 实例实验室；
- 增加活动更新、全部更新、错峰、阴影/像素比质量开关与 renderer 指标；
- 添加调度器单元测试和上游/实验室浏览器验收。

### 结果

- 11 模型、133 parts、259 Mesh、24,776 triangles、609 sequences；全部 audit clean；
- 9 watchtower 约 254 calls，25 个约 702 calls，随实例近似线性增长；
- 活动集合调度边界可放在 contract 外部；
- 单体每个 Mesh 独立 geometry、每个 factory 独立 material，是下一阶段资源共享实验的直接证据；
- 上游没有 LICENSE，公开派生和再分发必须暂停在权利澄清之前。

### 失败与修正

- 通用 Three.js 静态探针没有识别 import-map HTML，因此改用源码定位与浏览器运行时统计；
- 沙箱内 Playwright 启动 Chromium 返回 `EPERM`，经授权后在沙箱外完成验收；
- 无头软件渲染 FPS 很低，明确从结论中排除，不把它包装成硬件性能数据。

### 下一步

实现共享 Geometry/Material 与静止态合并对照组；用真实 GPU 和固定相机路线测 CPU/GPU frame、draw calls、内存与质量差异。
