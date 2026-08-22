# Procedural Terrains 研究

> 研究一个 GPU 驱动的 Three.js 地形编辑器，重点验证它如何统一程序化生成、三种世界尺度、实时编辑与生产资产导出。

## 元信息

| 字段 | 内容 |
| --- | --- |
| 状态 | `archived` |
| 原项目 | [ZyFou/ProceduralTerrains](https://github.com/ZyFou/ProceduralTerrains) |
| 上游版本 | `b378e0e2df66678a44df4edc057dda05436f0b59`（应用版本 `1.5.2`） |
| 开始日期 | 2026-08-22 |
| 在线演示 | [研究展厅](../../docs/demos/procedural-terrains/) · [RTS 技术原型](../../docs/demos/procedural-terrains/rts-map-profile/) · [上游在线版本](https://terrains.zyfod.dev/) |
| 上游许可证 | MIT，Copyright (c) 2026 ZyFou |

本轮探索已经归档，后续仅在出现明确的游戏地图、地理地图或三维地形生产需求时恢复。最终选型、RTS 原型审计、0 A.D. 当前托管位置和恢复条件见 [ARCHIVE.md](ARCHIVE.md)。

## 第一：能力展示

独立的[研究展厅](../../docs/demos/procedural-terrains/)使用固定提交的真实运行截图展示主要能力，而不是用概念图代替产品证据。

| 能力面 | 已确认能力 | 证据 |
| --- | --- | --- |
| 世界尺度 | Tile、Infinite World、Planet | 三种模式本地稳定帧与模式控制 |
| 内置样例 | 4 种创作入口、5 个 Procedural templates、8 个 Nodes recipes | `ProjectTemplates.js`、`NodeProjectTemplates.js` 与模板测试 |
| 创作方式 | 参数面板、噪声层、节点图、画笔、样条线、真实高程导入 | 上游截图与源码探针 |
| 环境系统 | 水、海岸/泡沫、水下效果、程序天空、云、大气、昼夜 | 引擎模块与测试 |
| 探索 | Tile 轨道相机、Infinite Walk/Plane、Planet orbit | 本地浏览器交互 |
| 生产输出 | GLB/GLTF、OBJ、纹理、splat、碰撞、水遮罩和五种目标预设 | 导出模块、preflight 与构建 |
| 项目工作流 | local-first 项目存储、模板、撤销重做、JSON 保存 | IndexedDB/localStorage 与项目状态代码 |

上游自带样例完整盘点：

- 创作入口：Procedural、Nodes、Manual Terrain、Real Terrain。
- Procedural templates（5/5）：Blank terrain、Island、Mountain range、Geological Hybrid、Desert。
- Nodes recipes（8/8）：Blank graph、Geological Hybrid、Alpine ridges、Layered highlands、Wind dunes、River canyon、Crater basin、River valleys。

节点配方并非只用于预览：上游测试会逐个创建图文档，检查可达性、图诊断、容量与实时 Shader 编译结果。

### 已构建探索：RTS Map Profile

[RTS Map Profile](rts-map-profile/) 是一个不修改上游固定提交的独立 Three.js 原型，用来验证“地形生产底座”如何继续生成游戏地图语义：

- 相同 Seed 与参数确定性复现，双阵营沿阵营轴镜像。
- 两个平整基地、两条主路线、两个隘口、阵营镜像资源和中央争夺资源。
- 同时输出高度、通行、建造、道路与基地网格，不把语义只画成装饰。
- WebGL 三维检查 + Canvas 2D 数据回退；两条路径都能重生成并导出相同 JSON。
- 当前边界是确定性数据与可视化技术探索，不包含具体游戏的单位寻路、建造、战斗协议或版权资产；它也尚未证明路线拓扑、隘口意义或竞技公平。

运行：

```powershell
Set-Location projects/procedural-terrains/rts-map-profile
npm.cmd install
npm.cmd test
npm.cmd run dev
```

打开 `http://127.0.0.1:6072/`。静态构建由 `npm.cmd run build` 输出到 `docs/demos/procedural-terrains/rts-map-profile/`。

## 第二：技术原理

```text
React / App state
  → Three.js Engine（scene / camera / chunk / material / uniform）
  → WebGL2
  → GLSL Shader
  → GPU 并行计算高度、法线和生物群系颜色
  → 实时画面或 GPU bake 导出
```

关键机制：

- 地形是 `(world XZ, seed, params)` 的确定性函数，相机只改变 LOD，不改变形状。
- 可序列化噪声栈由 [`noiseStackCodegen.js`](upstream/src/engine/terrain/noise/noiseStackCodegen.js) 生成 GLSL。
- Tile、Infinite World 与 Planet 共享地形语言，但分别使用 board chunks、相机相对流送网格与 cube-sphere 空间组织。
- chunk skirt 遮住跨 LOD 裂缝；fragment 阶段有限差分重算法线，以 GPU 成本换取低几何 LOD 下的细节。
- 导出器从同一规则烘焙高度、颜色、法线与目标引擎资产，避免实时显示与离线资产完全分叉。

更完整的源码映射见 [CAPABILITY_MAP.md](CAPABILITY_MAP.md)。

## 第三：使用场景

| 场景 | 为什么适合 | 主要输出或边界 |
| --- | --- | --- |
| 游戏世界快速原型 | 快速确定地貌、生物群系、水位与探索尺度 | GLB、RAW/R16、splat、碰撞 |
| 影视和概念世界构建 | seed 可复现，行星、远景地貌和环境可持续调参 | Blender/Three.js 资产与参考帧 |
| 真实地形可视化原型 | 高程、影像和建筑足迹可进入交互场景 | 适合沟通原型，不是测绘级 GIS |
| Shader / LOD 教学研究 | 同仓库包含 codegen、LOD、流送、cube-sphere、水与 GPU bake | 可运行源码、测试与性能面板 |

当前证据不足以承诺低端移动设备全质量运行、科学侵蚀模拟、测绘级精度或各目标引擎导入后的完全视觉一致。

## 第四：如恢复研究的扩展方向

| 优先级 | 方向 | 源码切入点 | 验收标准 |
| --- | --- | --- | --- |
| 1 | 按世界模式拆包与 Shader 预热 | `Engine.js`、`planetBundle.js`、Vite chunks | 首屏请求下降，首次切换等待缩短，状态不丢失 |
| 2 | 实时画面到目标引擎的一致性夹具 | `TerrainExporter.js`、`ExportValidator`、各目标预设 | 固定 seed 的高度、比例、轴向、法线和水位可自动核对 |
| 3 | 噪声图与高度采样插件接口 | `NoiseStack.js`、codegen、`GpuHeightSampler.js` | 第三方节点可注册、序列化，并跨三模式一致运行 |
| 4 | 渐进式 WebGPU compute | WebGPU 侵蚀、GPU 分级、CPU fallback | 支持设备获得可测加速，不支持设备仍可完成相同任务 |
| 5 | RTS 地图语义 Profile | `rts-map-profile/src/generator.js`、目标游戏适配器 | 固定 Seed 可重放；出生/资源公平；目标游戏可加载并完成路径测试 |

## 研究边界

### 包含

- React 编辑器与框架无关的 `src/engine/` 边界。
- Shader 地形、噪声代码生成、分块 LOD、无限世界流送和 cube-sphere 星球。
- 水体、天空、云、程序化道具、绘制、项目存储与资产导出。
- 测试覆盖、生产构建结果和静态能力图。

### 不包含

- 可选 Node.js/MySQL 账户服务的部署与安全审计。
- 对上游功能或视觉风格的修改。
- Unity、Unreal、Godot、Blender 导出结果的逐引擎导入验收。
- 独立演示、录屏和移动真机性能基线；这些留给后续实验。

## 目录

```text
projects/procedural-terrains/
├─ README.md          # 研究入口、范围与当前判断
├─ CAPABILITY_MAP.md  # 渲染、场景、交互、发布与风险能力图
├─ NOTES.md           # 可复现实验日志
├─ SHOWCASE_CONTRACT.md # 研究展厅设计契约与验收清单
└─ upstream/          # 固定提交的 Git 子模块
```

## 快速开始

```powershell
git submodule update --init --recursive projects/procedural-terrains/upstream
Set-Location projects/procedural-terrains/upstream
npm.cmd ci
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

开发服务器默认使用 `http://localhost:6061`。编辑器是 local-first，研究前端无需配置账户 API 或 MySQL。

## 验证结果

在 Windows、Node.js `22.15.0`、npm `10.9.2` 下验证：

- `npm test`：49 个测试文件、452 项测试全部通过，耗时 6.79 秒。
- `npm run build`：Vite 生产构建成功，2200 个模块完成转换，耗时 18.90 秒。
- 静态探针扫描 319 个源码类文件，定位到渲染器、循环、Shader、实例化、控制器、导出和 UI 边界。
- 构建产生大于 500 kB 的 `Engine`、入口和 Three.js chunk；这是后续拆包研究的量化起点，不等同于实际网络传输大小。

复现过程见 [NOTES.md](NOTES.md)，结构化能力判断见 [CAPABILITY_MAP.md](CAPABILITY_MAP.md)。

## 阶段结论

1. 这不是单一地形示例，而是完整的地形创作工具链。实时显示由 GPU 高度函数驱动，导出侧再从同一规则烘焙高度、颜色、法线和引擎预设资产。
2. React 主要承担产品界面和参数镜像，Three.js 引擎集中在 `src/engine/`，两者通过 `Engine` 方法与 callbacks 通信；这个边界具备复用价值。
3. 三种世界模式共享确定性种子、噪声与材质语言，但使用不同空间组织：Tile 是固定分块板，Infinite World 是相机周围流送网格，Planet 是 cube-sphere 与轨道相机。
4. 值得优先抽取的能力是噪声栈到 GLSL 的代码生成、跨 LOD 裂缝处理、GPU 烘焙导出和生产预检。完整 `Engine` 体量较大，不适合原样嵌入轻量项目。
5. 当前自动化证据证明逻辑测试与构建可靠，但尚未证明低端 GPU、移动真机、长时间流送或各目标引擎导入质量。

## 来源与许可

上游源码以 Git 子模块保留，研究文档不宣称第三方源码为本仓库原创。上游使用 MIT License；复制或发布其实质代码时必须保留原版权与许可文本。
