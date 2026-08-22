# Procedural Terrains 研究归档

> 状态：`archived`  
> 归档日期：2026-08-22  
> 固定上游：[`ZyFou/ProceduralTerrains@b378e0e2`](https://github.com/ZyFou/ProceduralTerrains/tree/b378e0e2df66678a44df4edc057dda05436f0b59)（应用版本 `1.5.2`）

## 归档结论

本轮研究已经回答“它是什么、怎样工作、适合什么、能否扩展为游戏地图底座”四个问题，暂不继续开发。

Procedural Terrains 是成熟度较高的浏览器地形创作与预览工具链：它擅长确定性地形、三种世界尺度、Shader/LOD、环境渲染和生产资产导出；但它不是完整的游戏地图编译器，也不是 GIS。对红警式 RTS 地图而言，地形只是输入层之一，可玩性还需要战略布局、CPU 权威网格、约束求解、验证、候选淘汰和目标游戏适配。

后续只有在出现明确的游戏地图、地理地图或三维地形生产需求时，才按本档案的选型路线恢复研究。

## 已保留成果

| 成果 | 位置 | 说明 |
| --- | --- | --- |
| 研究入口 | [README.md](README.md) | 能力、原理、场景、扩展与验证结果 |
| 能力图 | [CAPABILITY_MAP.md](CAPABILITY_MAP.md) | 渲染、场景、交互、发布和风险边界 |
| 实验日志 | [NOTES.md](NOTES.md) | 固定提交、测试、构建、浏览器与原型证据 |
| 研究展厅 | [`docs/demos/procedural-terrains/`](../../docs/demos/procedural-terrains/) | 上游真实截图、全部内置样例和四章说明 |
| RTS 技术原型 | [rts-map-profile/](rts-map-profile/) | 确定性高度、双阵营语义网格、检查视图和 JSON 导出 |
| 固定上游 | [upstream/](upstream/) | Git 子模块，保持上游版权和历史边界 |

远端发布后：

- 研究展厅：<https://yydshly.github.io/0821_githubcode_study/demos/procedural-terrains/>
- RTS 技术原型：<https://yydshly.github.io/0821_githubcode_study/demos/procedural-terrains/rts-map-profile/>

## 原库能力与内置样例

上游不是单一噪声图片生成器。固定提交已确认：

- 世界模式：Tile、Infinite World、Planet。
- 创作入口：Procedural、Nodes、Manual Terrain、Real Terrain。
- Procedural templates（5/5）：Blank terrain、Island、Mountain range、Geological Hybrid、Desert。
- Nodes recipes（8/8）：Blank graph、Geological Hybrid、Alpine ridges、Layered highlands、Wind dunes、River canyon、Crater basin、River valleys。
- 环境：水、海岸/泡沫、水下、天空、云、大气、昼夜。
- 地表与道具：Biome/材质混合、草、花、岩石、阔叶树和针叶树等程序化散布。
- 输出：GLB/GLTF、OBJ、纹理、高度、splat、碰撞、水面/水遮罩和目标引擎预设。

研究展厅用固定提交的本地运行截图展示这些能力；没有把静态截图冒充上游实时编辑器。RTS 子页面是本研究独立原型，不是上游自带样例。

## 最终技术理解

### 地图需要分层，但不能割裂

```text
MapRecipe / master seed
  → 战略结构：基地、路线、隘口、资源区
  → 地形层：height、slope、water
  → 游戏规则层：walkable、buildable、movementCost、clearance
  → 地表层：草地、岩石、雪、道路、河岸材质
  → 对象层：树木、石块、桥梁、资源和建筑
  → 验证通过后渲染、导出和进入目标游戏
```

- 地形层决定几何和自然约束。
- 地表层决定同一几何如何着色和混合材质。
- 对象层以地形、道路、基地和排除遮罩为条件散布。
- 游戏层决定是否可走、可建、可攻击和公平。
- 一条道路应同时驱动地形整平、材质、移动成本和植被排除，而不是只有一张路面贴图。

### CPU 与 GPU 的职责

- GLSL/GPU 适合实时高度、法线、材质、实例和画面生成。
- CPU 负责权威 MapRecipe、固定高度烘焙、寻路/建造网格、实体 ID、验证和导出。
- 游戏规则不能只存在于 Shader 中；实时画面与导出数据必须来自同一配方并可核对。

### RTS 应采用“战略骨架优先”

对 RTS 而言，不能只生成随机山地后再摆基地。更可靠的流程是先保留基地、主攻/侧翼路线、隘口和资源区，再让地形服从战略结构，最后铺材质和植被。生成器需要创建多个候选、自动拒绝不合格地图，并允许设计师修订后重新验证。

## RTS 原型的真实边界

当前原型证明了小型数据闭环，但不证明地图已经可玩或具有生产画质。

已验证：

- 同 Seed 与参数确定性复现。
- 阵营轴镜像、出生点、资源稳定 ID 和 JSON 输出。
- 高度、坡度、道路、基地、通行、建造网格分离。
- Three.js 检查视图和无 WebGL 的 Canvas 2D 回退。
- 4/4 自动化测试和 Vite 生产构建。

100 个 Seed 的诊断结果：

- 100/100 出生点连通。
- 100/100 资源位于可通行格。
- 可通行比例平均约 `99.83%`，最低约 `96.45%`。
- 可建造比例平均约 `76.72%`。

这些数字同时暴露了缺陷：几乎整张图都可走，当前两条路线和两个隘口缺少真实拓扑意义。`routeCount` 是声明数量，不是独立路线证明；当前测试也没有验证路线宽度、两条点不相交路径、连续基地面积、资源寻路成本公平、引擎导入或 AI 完赛。因此它只能标记为“技术探索”。

## 后续选型路线

| 明确需求 | 首要研究对象 | Procedural Terrains 的位置 |
| --- | --- | --- |
| 红警/C&C 类可玩地图 | [OpenRA](https://github.com/OpenRA/OpenRA) 的地图生成、格式与编辑器 | 可选的 3D 地形/网页预览器，不作为规则权威 |
| 通用 RTS 随机地图 | [0 A.D.](https://play0ad.com/) 的 Random Map Scripts | 借鉴地形和环境表达 |
| 河流、流域、气候和 Biome | [Mapgen4](https://github.com/redblobgames/mapgen4) | 负责三维表现或资产输出 |
| 专业节点地形与侵蚀 | [TerraForge3D](https://github.com/Jaysmito101/TerraForge3D) | 作为 Web 侧对照或轻量预览 |
| Godot 运行时地形 | [Terrain3D](https://github.com/TokisanGames/Terrain3D) | 上游高度/材质资产的来源之一 |

0 A.D. 没有停止开发：旧 GitHub 镜像在 2024 年归档，当前源码与问题跟踪已迁移到 Wildfire Games 的 [Gitea](https://gitea.wildfiregames.com/0ad/0ad)。官方于 2026-02-18 发布了 [Release 28: Boiorix](https://play0ad.com/new-release-0-a-d-release-28-boiorix/)。未来研究不能把旧 GitHub 镜像当作最新源码。

## 恢复研究的触发条件

只有下列输入明确后再恢复：

1. 目标是游戏地图、地理地图还是三维地形资产。
2. 目标游戏/引擎和真实导出格式。
3. 地图尺寸、玩家数、对称规则、路线和资源公平标准。
4. 视觉质量、运行设备和性能预算。
5. 最终验收方式：引擎加载、AI 完赛、人工盲测或地理指标。

游戏地图恢复时优先实现 P0 验证器：连通性、至少两条独立进攻路线、路线净宽、连续基地面积、资源路径成本、公平阈值、候选拒绝/重生成。视觉精修和植被资产应排在这些硬约束之后。

## 复现与验证

上游：

```powershell
git submodule update --init --recursive projects/procedural-terrains/upstream
Set-Location projects/procedural-terrains/upstream
npm.cmd ci
npm.cmd test
npm.cmd run build
```

RTS 技术原型：

```powershell
Set-Location projects/procedural-terrains/rts-map-profile
npm.cmd ci
npm.cmd test
npm.cmd run build
```

RTS 构建使用相对资源路径，输出到 `docs/demos/procedural-terrains/rts-map-profile/`，可随 `docs/` 发布到 GitHub Pages。

## 许可与发布边界

- 上游 Procedural Terrains：MIT，版权归 ZyFou；以 Git 子模块保留来源。
- 研究文档和独立 RTS 原型不宣称第三方源码或品牌为本仓库原创。
- 展厅截图用于说明固定提交的能力，必须保留上游链接和版权说明。
- 原型没有复制《红色警戒》素材、地图格式或游戏规则。
- 本次归档不承诺生产可用、竞技公平、GIS 精度或目标引擎兼容。
