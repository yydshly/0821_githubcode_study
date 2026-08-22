# 能力图

本页把上游的真实引擎能力与一次性界面表现分开，结论基于固定提交 `b378e0e2`、源码静态探针、452 项测试和生产构建。

> 本研究现已归档。能力图保留为固定提交的证据快照；恢复条件和跨项目选型见 [ARCHIVE.md](ARCHIVE.md)。

## Rendering stack

- React 18 + Vite 5 提供编辑器外壳，Three.js `0.160.x` 提供 WebGL2 渲染。
- [`Engine.js`](upstream/src/engine/Engine.js) 管理 renderer、scene、camera、状态到 uniform 的同步和资源生命周期；React 通过方法和 callbacks 镜像状态。
- [`createWebGLRenderer.js`](upstream/src/engine/render/createWebGLRenderer.js) 是渲染器创建边界。WebGPU 只出现在侵蚀计算辅助模块，不代表主渲染器已迁移到 WebGPU。
- [`terrainGLSL.js`](upstream/src/engine/terrain/terrainGLSL.js) 与 [`noiseStackCodegen.js`](upstream/src/engine/terrain/noise/noiseStackCodegen.js) 组成地形规则到 GLSL 的核心路径。

可复用判断：噪声代码生成与参数序列化是通用引擎能力；React 侧面板和品牌视觉属于产品层。

## Scene assets

- 地形：固定 Tile board、相机周围流送的 Infinite World、cube-sphere Planet。
- 环境：程序天空、昼夜、分层或体积云、海洋与水下效果。
- 表面：高度、法线、生物群系、调色板、近景细节和手工绘制层。
- 道具：程序化分布与实例化植被/物件，另有 GLB 资产库入口。
- 导入：真实世界高度图、地图选择器、地表材质和手工地形工作流。

没有传统关卡资产包驱动核心地形；地貌主要由确定性函数、参数和绘制数据产生。

## Motion system

- 主循环由引擎驱动，并根据世界模式更新相机、流送分块、水、云和渲染 pass。
- Infinite World 依据相机位置重用或重建周围 chunk，并受三角形预算和视锥/身后剔除约束。
- Planet 使用轨道控制与 cube-sphere 分块；探索模式另有 Walk 和 Plane 控制。
- 云、水、时间与程序化道具使用连续参数变化，不依赖预制动画片段。
- 未发现内置录屏时间线或影片导演系统。

## Interaction

- Tile 编辑相机支持平移、轨道旋转、缩放、俯视/斜视/重置。
- Infinite World 与 Planet 支持步行和飞行探索，并包含移动触控入口。
- 参数面板、设置搜索、节点工作区、画笔、样条线、导入和导出组成完整创作交互。
- `Ctrl+K` 搜索、`Ctrl+Z/Y` 撤销重做、`Ctrl+Shift+P` 性能面板。
- 项目保存采用 IndexedDB，localStorage 作为回退；账户 API 是可选扩展。

## Visual quality

- 法线在 fragment 阶段由高度函数有限差分，低几何 LOD 下仍能保持远景表面细节。
- chunk skirt 处理相邻 LOD 裂缝；相机影响 LOD，但不改变确定性地形形状。
- 水系统包含反射、水面 pass、海岸/泡沫遮罩和水下效果。
- 天空、云、大气、昼夜与行星风格系统提供整体环境一致性。
- 有 GPU 分级、像素比、LOD 预算和水质等性能调节；尚无本研究独立视觉回归证据。

## Publishing path

- 快速输出：视口 PNG 与正交灰度高度图。
- 完整输出：GLB/GLTF、OBJ、颜色/法线/高度纹理、生物群系 splat、碰撞网格、水面和水遮罩。
- 生产预设：Unity Terrain、Unreal Landscape、Godot Terrain3D、Blender Scene 与 Three.js Viewer Assets。
- Unity/Unreal 可生成小端 unsigned 16-bit RAW/R16；导出前置检查会阻止不合法组合并提示内存风险。
- Vite 静态构建可部署前端；可选账户 API 需要 Node.js/MySQL，不能作为纯静态 Pages 能力处理。
- 上游没有内置 WebM/MP4、字幕、旁白或封面发布流水线。

## Risks

| 风险 | 当前证据 | 后续验证 |
| --- | --- | --- |
| 首屏与主引擎体积 | 构建报告 `Engine` 765.56 kB、入口 561.02 kB、Three.js 521.04 kB（minified，未计 gzip） | 记录真实初始请求链，按世界模式和编辑器工具测试动态加载 |
| GPU 成本 | fragment 法线需要多次高度求值，云、水和后处理继续叠加 pass | 在集显、低端移动 GPU 上记录帧时间与降级路径 |
| 三模式复杂度 | 共享状态需要同步到三套空间组织与多套材质/导出路径 | 建立相同 seed/params 的跨模式一致性测试 |
| 流送稳定性 | 已有 Infinite World 性能测试，但没有本研究的长时浏览器证据 | 固定相机路线运行 30 分钟，记录 chunk、显存与 JS heap |
| 导出承诺范围大 | 单元测试与 preflight 通过，不代表各目标引擎视觉一致 | 为每个目标引擎建立最小导入验收夹具 |
| 浏览器与移动兼容 | WebGL2 是硬前提，触控入口存在 | 补 Safari/iOS、Android Chrome 与降级提示实测 |

## 下一阶段优先级

1. 浏览器运行基线：启动、首个可交互帧、三模式切换和 WebGL 错误。
2. 录制一条固定相机/参数路线，采集帧时间、显存代理指标和 chunk 数。
3. 选择一个相同 seed，比较实时 Tile、烘焙高度图与导出 GLB 的一致性。
4. 验证按世界模式延迟加载是否能降低初始引擎 chunk，同时不破坏编辑器状态。
