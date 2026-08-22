# 研究展厅设计契约

## Contract

```text
Entry mode: Revision-led
Request revision: 3
Target user and context: 评估程序化地形技术的前端、图形、游戏和工具链开发者
Desired first impression: 这是一个经过验证、能力完整且可继续拆解的 GPU 地形工作台
Visual ambition: Editorial
Experience architecture: Editorial Flow
Visual constraints: 使用真实上游截图；深色技术画布；高对比蓝绿强调；不伪造 3D 运行结果
Information constraints: 严格按能力展示、技术原理、使用场景、扩展方向四章组织；第一章不得遗漏上游自带样例；事实与推断分开
Operation constraints: 静态 GitHub Pages 可运行；桌面、平板、390px 手机可读；键盘可达；无外部运行依赖
State constraints: 四章导航、能力标签切换和原理步骤高亮必须有明确选中态；无 JS 时正文仍完整
Environment constraints: 复用当前 docs 发布方式；不复制完整上游应用；不引入 npm 依赖或后端
Primary journey: 首屏理解项目定位 → 浏览能力证据 → 理解 GPU/Three.js 原理 → 匹配使用场景 → 选择扩展方向
User-defined phases: 第一 能力展示；第二 技术原理；第三 使用场景；第四 扩展方向
Required artifacts: 独立展厅页、响应式样式、最小交互脚本、真实截图资产、README 四章结构、浏览器验收记录
Autonomy authorization: 用户已明确要求四部分内容；允许在现有研究子项目内直接实现可逆文件改动
User-decision boundary: 若要嵌入完整上游编辑器、发布第三方源码副本或改变研究范围，需要额外决定
Observable completion criteria: 四章按顺序出现；能力有真实截图或测试证据；上游内置创作入口、程序化模板与节点配方均被盘点展示；原理有 CPU→Three.js→WebGL→Shader→GPU 流程；场景含适配与不适配；扩展含价值、切入点和验证标准；桌面/平板/手机无溢出；键盘与 reduced-motion 可用
```

## Revised direction

| 层级 | 保留 | 本次调整 | 验收标准 |
| --- | --- | --- | --- |
| Composition | 研究实验室总展厅卡片 | 新增独立长页，以四章作为唯一主阅读路径 | 页内顺序与用户四点完全一致 |
| Focal hierarchy | 上游真实产品身份 | 首屏先展示能力证据和三种世界尺度，不先堆技术名词 | 首屏可回答“它能做什么” |
| Typography | 实验室的中英混排 | 标题采用编辑感衬线，数据与证据采用等宽角色 | 章节、证据、正文三层清晰 |
| Palette | 现有实验室浅色酸绿 | 独立页采用深岩层背景、地形绿和 WebGL 蓝 | 正文高对比，颜色不作为唯一状态线索 |
| Material/depth | 简洁平面卡片 | 截图、流程轨道和证据卡形成有限深度 | 不使用无意义玻璃拟态或重阴影 |
| Density | 总页的摘要密度 | 能力密集，原理分步，场景与扩展用可扫描矩阵 | 手机端卡片单列且正文不缩成细字 |
| Motion | 平滑滚动 | 只为标签切换和章节进入提供轻量过渡 | reduced-motion 下禁用非必要动画 |

## Coverage manifest

| 用户阶段 | 要求或产物 | Surface / state | 证据 | Owning stage | 状态 | 下一动作 |
| --- | --- | --- | --- | --- | --- | --- |
| 第一 能力展示 | 三种世界模式与编辑/导出能力 | 桌面、平板、手机；默认与切换态 | 真实截图、DOM、交互截图 | 2-7 | `pass` | 三模式本地稳定帧；标签点击与键盘切换通过 |
| 第一 能力展示 | 原库自带创作入口、程序化模板与节点配方 | 样例清单与来源证据 | 源码、测试与浏览器模板页 | 3 | `pass` | 4 种入口、5/5 Procedural、8/8 Nodes 已展示 |
| 第二 技术原理 | CPU/Three.js/WebGL/Shader/GPU 流程与关键源码 | 五步流程、源码证据 | DOM、链接与浏览器截图 | 3 | `pass` | 桌面流程轨道和四个原理卡可读 |
| 第三 使用场景 | 适合、不适合与输出物 | 场景卡、窄屏排列 | DOM 与响应式截图 | 3/7 | `pass` | 四场景与不承诺边界已通过手机检查 |
| 第四 扩展方向 | 方向、源码切入点、验证标准 | 扩展路线图 | DOM、链接与响应式截图 | 3/7 | `pass` | 四条路线均含价值、切入点与验收标准 |
| 全局导航 | 按四章顺序跳转，当前章节可辨识 | 鼠标、键盘、滚动 | 浏览器交互记录 | 4/5 | `pass` | IntersectionObserver 当前态、语义链接与标签键盘路径通过 |
| 响应式 | 1440、900、390px 无遮挡溢出 | 三个 viewport | 浏览器截图 | 7 | `pass` | 三视口通过；390px `scrollWidth <= innerWidth` |
| 无障碍/运动 | 语义标题、alt、focus、reduced-motion | 键盘与媒体查询 | DOM/样式与交互记录 | 7/8 | `pass` | 焦点轮廓可见；ArrowRight 切换；reduced-motion 计算样式通过 |
| 工程交付 | 静态资源、链接、README 与总展厅入口 | 文件与 Pages 路径 | 构建/静态检查 | 9 | `pass` | 所有本地资源 HTTP 200；JS syntax 与 diff check 通过 |

## Browser evidence

- Canonical runtime：`python -m http.server 8787 --bind 127.0.0.1 --directory docs`
- Canonical URL：`http://127.0.0.1:8787/demos/procedural-terrains/`
- 日期：2026-08-22
- 浏览器表面：1440×900、900×1000、390×844；单一深色主题。
- 主路径：首屏 → 三模式标签 → 内置样例 → 原理 → 场景 → 扩展。
- 状态：Tile 默认；Infinite World 点击态；Tile 聚焦后 `ArrowRight` 切到 Infinite World，选中项和焦点一致且 outline 可见。
- reduced-motion：媒体查询命中，`scroll-behavior: auto`，过渡被压缩到 `0.01ms`。
- 最终完整性：正文长度 4233，错误覆盖层 false，破损图片 0，横向溢出 false，样例计数 `5 / 5` 与 `8 / 8`。
- 静态负载：6 张真实证据图共 2,143,689 bytes，均为本地懒加载资源；不是线上网络性能基准。
- 上游取证运行时未启动可选账户 API，因此 Vite 记录 `/api/v1/analytics/visit` 与 `/api/v1/auth/session` 的 `ECONNREFUSED`；编辑器本地功能与三模式取证未被阻断。研究展厅自身不调用该 API。

## Terminal audit

- 所有用户阶段均为 `pass`，无 `continue`、`defer` 或 `blocked`。
- 必需产物齐全：独立页面、CSS、JS、6 张证据图、README 四章结构、验收契约和实验日志。
- 页面只支持契约指定的深色主题；没有未声明的主题切换状态。
