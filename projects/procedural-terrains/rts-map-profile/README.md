# RTS Map Profile

这是 Procedural Terrains 研究的独立可运行扩展，用来验证程序化高度场能否继续加工成 RTS 游戏地图的基础数据。

> 归档状态：技术探索。它证明了确定性数据闭环，不是可直接用于游戏的地图生成器，也没有证明竞技公平。

## 已实现

- Seed 驱动的确定性高度网格。
- 双阵营镜像、基地平整、两条战略路线与两个隘口。
- 镜像资源与中央争夺资源，全部使用稳定 ID。
- 高度、坡度、通行、建造、道路与基地语义网格。
- Three.js 三维地图、四种检查视图和格点检查器。
- WebGL 不可用时的 Canvas 2D 数据回退。
- JSON 导出；不依赖后端。

这不是完整的 RTS 游戏。单位寻路、建筑规则、战斗、视野和具体游戏地图协议不在当前原型范围内。

## 已知限制

- 100 个 Seed 中出生点均连通、资源均可通行，但地图平均约 99.83% 可通行，路线和隘口缺少真实拓扑意义。
- 当前 `routeCount` 是配方声明，不是两条独立进攻路径的算法证明。
- 尚未验证路线净宽、连续基地面积、资源寻路成本公平、目标引擎导入或 AI 完赛。
- 几何、顶点色和程序化标记只用于数据检查，不代表生产画质。

完整结论与恢复路线见 [../ARCHIVE.md](../ARCHIVE.md)。

## 运行

```powershell
npm.cmd install
npm.cmd test
npm.cmd run dev
```

打开 <http://127.0.0.1:6072/>。

强制检查无 WebGL 回退：<http://127.0.0.1:6072/?fallback=1>。

## 构建

```powershell
npm.cmd run build
```

构建输出位于 `docs/demos/procedural-terrains/rts-map-profile/`，使用相对资源路径，可作为研究展厅的静态子页面发布。

## 导出数据

导出的 `rts-map-<seed>.json` 包含：

- `params`：Seed、网格、世界尺寸与生成参数。
- `grid.heights`：归一化高度。
- `grid.walkable` / `grid.buildable`：通行与建造语义。
- `grid.road` / `grid.base`：战略路线与基地平整区。
- `spawnPoints`、`resources`、`objectives`、`routes`：带稳定 ID 的地图实体。
- `metrics`：镜像、通行、建造与路线指标。

设计与验收范围见 [DESIGN_CONTRACT.md](DESIGN_CONTRACT.md)。
