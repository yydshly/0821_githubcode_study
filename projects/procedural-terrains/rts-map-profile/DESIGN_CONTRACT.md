# RTS Map Profile · 交付契约

> 归档说明：下列内容记录原型交付时的验收范围。后续 100 Seed 审计表明地图平均约 99.83% 可通行，路线与隘口尚无真实拓扑证明，因此最终定位是技术探索，而不是生产地图生成器。

## Design contract

- Entry mode: brief-led implementation
- Request revision: 1
- Target user and context: 正在验证 Procedural Terrains 能否成为 RTS 游戏地图生产底座的技术研究者
- Desired first impression: 这不是概念图，而是能生成、检查并导出地图语义的实时工具
- Visual ambition: Immersive
- Experience architecture: Spatial Stage
- Scene base: WebGL（Three.js），同时提供 Canvas 2D 数据回退
- Scene persistence: 生成、切换图层、检查格点与导出过程中持续可见
- Foreground control model: 顶部状态栏、左侧参数面板、场景内图层控制、移动端抽屉
- State-to-scene mapping: 默认地图、重新生成、图层切换、格点选中、导出完成、WebGL 回退
- Mobile transformation: 左侧面板转换为可关闭抽屉，场景仍是主要表面
- Fallback: WebGL 不可用时仍可生成数据、查看 2D 战术图并导出 JSON
- Visual constraints: 深色战术工作台；绿色表示可通行，蓝色表示可建造，琥珀表示资源/目标；避免装饰压过地图
- Information constraints: 明确区分地形数据、游戏语义与验证指标
- Operation constraints: Seed 重生成、地形强度和水位调整、四种视图、格点检查、JSON 导出
- State constraints: 相同 Seed 与参数必须生成相同数据；双阵营镜像；基地、资源和主路线拥有稳定 ID
- Environment constraints: 独立 Vite/Three.js 原型；不修改固定提交的上游子模块；静态构建进入研究展厅目录
- Primary journey: 调整 Seed → 生成地图 → 切换通行/建造/战略图层 → 检查公平性 → 导出地图 JSON
- User-defined phases: 尝试构建 RTS 地图生产能力
- Required artifacts: 可运行原型、确定性生成器、浏览器可视化、导出数据、测试、研究页入口、运行说明
- Autonomy authorization: 用户明确要求“请尝试构建”，允许在当前子项目内直接实现可逆原型
- User-decision boundary: 不接入具体商业游戏格式，不复制《红色警戒》资产或规则
- Observable completion criteria: 构建成功；测试通过；桌面与窄屏可完成主流程；不同图层可见；相同 Seed 可复现；JSON 可导出；WebGL 错误不阻断数据工作流

## Coverage manifest

| User phase | Requirement or artifact | Surface / state | Evidence needed | Owning stage | Status | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| 尝试构建 | 可运行空间工作台 | Desktop / default | 浏览器截图与 DOM | 1-3 | pass | `.tmp/rts-map-evidence/desktop-default.png`，WebGL Canvas 与关键控件存在 |
| 尝试构建 | Seed 确定性生成 | Generator | 自动化测试 | 5/9 | pass | Node test：相同 Seed 的高度与语义网格完全一致 |
| 尝试构建 | 基地、通道、资源与语义网格 | Strategic / layer states | 浏览器交互与测试 | 5-6 | pass | 战略视图切换成功；2 基地、2 路线、6 资源写入数据 |
| 尝试构建 | JSON 导出 | Export success | 下载事件与状态文本 | 5-6 | pass | Seed 12345 下载后 `data-exported-seed=12345` |
| 尝试构建 | 窄屏持续场景与抽屉 | Mobile / panel open-close | 截图、Escape、焦点返回 | 7 | pass | 390×844 截图；焦点进入 close-panel，Escape 后返回 open-panel |
| 尝试构建 | WebGL 回退 | Capability fallback | 2D 图仍可生成和导出 | 8 | pass | `?fallback=1` 显示 2D 数据图并保留全部参数和导出按钮 |
| 尝试构建 | 研究入口和文档 | Research page / README | 文件与链接检查 | 9 | pass | HTTP 研究页点击入口进入静态构建；两份 README 已更新 |
| 尝试构建 | 工程验证 | Build / test | 命令输出 | 9 | pass | 4/4 tests；Vite build 成功，主 JS gzip 129.08 kB |

## Design direction

| Decision | Chosen direction | Observable constraint | Acceptance criterion |
| --- | --- | --- | --- |
| Focal hierarchy | 地图占据主要视野，参数和指标作为前景层 | 首屏不能被说明文字淹没 | 首次扫描能识别地图、生成按钮与平衡状态 |
| Typography | 紧凑无衬线 UI + 等宽数据 | 数据标签与正文角色分明 | 关键指标在宽窄屏均不截断 |
| Palette | 深绿黑底、地形自然色、语义层固定色 | 颜色不是唯一状态信号 | 图层按钮和文字同时说明状态 |
| Material/depth | 半透明面板与清晰边界 | 控件必须始终高于场景 | 抽屉、提示和场景层级无冲突 |
| Motion | 仅地图生成和相机阻尼 | 尊重 reduced-motion | 关闭非必要过渡后信息仍完整 |

## Validation ledger

- Current stage: Stage 9 · Engineering and delivery closure
- Browser environment: Chromium automation，1280×800 / 1280×720 / 390×844，dark-only interface
- Canonical development URL: `http://127.0.0.1:6072/`
- Canonical static route: `http://127.0.0.1:6074/docs/demos/procedural-terrains/rts-map-profile/`
- Primary journey result: Seed 重生成、战略视图、JSON 导出均 pass
- Foreground result: 移动抽屉打开后焦点进入关闭按钮；Escape 关闭并返回触发按钮
- Capability result: 强制 fallback 路径保留 2D 地图、参数、视图与导出操作
- Performance observation: 65×65 地图在验收浏览器中同步生成约 0–11 ms；Three.js 主 JS 497.08 kB / gzip 129.08 kB
- Theme boundary: 当前原型只声明深色工作台，不承诺亮色主题
- Locale boundary: 中文界面；Seed 和导出模式不依赖文本宽度解析
- Final decision: scoped delivery pass；无 `continue`、`defer` 或 `blocked`
