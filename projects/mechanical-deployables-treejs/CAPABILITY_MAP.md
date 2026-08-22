# 能力图

本页区分上游真正可复用的运行时能力与一次性 Gallery 表现。证据来自固定提交 `f9d757d3`、源码检查、全模型浏览器审计和多实例实验。

## Rendering stack

- 原生 HTML + ES Module，无 npm、构建器或框架。
- import map 从 jsDelivr 加载 Three.js `0.180.0` 与 `OrbitControls`。
- `WebGLRenderer`、抗锯齿、最高 2x 像素比、PCF soft shadow、半球光和方向光。
- 未发现自定义 shader、后处理、WebGPU、InstancedMesh、GLTFLoader 或资源流送。

可复用能力是 Rig 返回标准 `root: Object3D`，宿主可把它加入任意 Three.js scene；Gallery 的单画布、灯光和控制栏只是示例宿主。

## Scene assets

- 11 个程序化模型：watchtower、sentry、coalfactory、house、skyscraper、railgun、automaton、dish、bridge、crane、colossus。
- 形体由 Cylinder、Torus、Sphere、Extrude 与自定义 chamfer box / ring segment 组合，没有外部 GLB/FBX。
- stock 模块提供六类共享语义材质：metal、dark、hazard、led、beacon、soil；材质对象只在单次 factory 内共享，不跨实例共享。
- 程序纹理用于划痕、锈迹和警示条；六个短 MP3 提供重件、零件、伺服、收纳和锁扣等声音语义。

## Motion system

- `createRig()` 把 `{ parts, clips }` 编译为按零件和 transform channel 索引的轨道。
- sequence 控制绝对的 `position|rotation|scale` x/y/z，支持 `linear`、`easeIn`、`easeOut`、`easeInOut` 与销毁专用 `gravity`。
- `appear` / `vanish` 管显隐，sound cue 与真实移动绑定，`fx` 回调处理灯光脉冲和信标闪烁。
- 必需 clips 是 `deploy` 和 `retract`；示例还包含 `destroyed`，sentry 另有 `alert`。
- `wreckClip()` 根据零件包围盒生成下落、散开、倾倒和有限反弹；这是确定性关键帧生成，不是刚体物理。
- 宿主可播放、暂停、变速、任意时间 seek、爆炸视图、开关零件与声音并释放资源。

## Validation

这是上游最有区分度的能力：动画不仅能播，还能按风格规则自动验收。

- Contract：接口版本、方法、零件名、clip、channel、sound id 等结构检查。
- Provenance：出现/消失时零件是否在地下或被可见父体遮蔽。
- Overlap：静止姿态下是否存在同向共面和地面 z-fighting 风险。
- Exposure：可见零件是否完全埋入另一个轴对齐兄弟包围盒。
- Attachment：可见零件是否接触地面或其他零件，避免悬空。

固定提交的 11 个模型均为零问题。审计基于世界轴对齐包围盒，是实用启发式，不等价于连续碰撞检测或任意曲面的机械可制造性证明。

## Interaction

- 模型切换；deploy / retract / destroy；静音；播放/暂停；时间轴拖动；爆炸视图；轨道相机。
- `partOf(object3d)` 支持拾取对象反查逻辑零件，但上游 Gallery 没有把零件 hover/选择面板完整做出来。
- 没有键鼠游戏控制、触摸专项 UI、建造选址、碰撞、寻路、联网或存档。

## Quantified model envelope

| 指标 | 11 模型合计 | 单模型范围 |
| --- | ---: | ---: |
| 逻辑零件 | 133 | 10–15 |
| Mesh | 259 | 17–44 |
| 三角形 | 24,776 | 1,520–4,092 |
| Clips | 34 | 3–4 |
| Sequences | 609 | 39–76 |
| Deploy authored duration | — | 4.22–4.97 s |

默认速度为 1.5x，因此玩家看到的部署时间更短。完整逐模型数据见[运行基线](evidence/RUNTIME_BASELINE.md)。

## Use cases

### 高匹配

- RTS/塔防建筑建造、收回与升级；
- 地下炮塔、雷达、桥梁、起重机和基地设施；
- 科幻场景机关、Boss 入场与阶段转换；
- 产品展示中需要可解释分件和爆炸视图的机械装置；
- AI 生成机械模型的风格约束与自动质量门。

### 需要扩展后匹配

- 大量同类单位同时部署；
- Blender/GLB 美术资产驱动；
- 多人游戏中的权威状态与客户端还原；
- 可破坏模块、真实碰撞和物理残骸；
- 移动端或弱 GPU 的多质量档运行。

### 低匹配

- 蒙皮角色、面部动画、布料、复杂有机体；
- 需要高精度 CAD 运动约束或工程仿真的场景；
- 仅靠一个整体 GLB clip 即可满足的线性演出。

## Publishing path

- 上游可用任意静态服务器运行，官方 GitHub Pages 已部署。
- 没有 package.json、lockfile、生产构建、离线依赖、错误/加载状态、浏览器兼容矩阵或性能预算。
- CDN 是运行硬依赖；离线游戏、受控版本和可复现构建需要本地依赖与打包。
- 未提供 LICENSE 是进入派生产品和公开扩展前的权利阻断项。

## Risks

| 风险 | 证据 | 判断 |
| --- | --- | --- |
| Draw call 线性增长 | 9 rigs 约 254 calls，25 rigs 约 702 calls | 大场景首要渲染风险，不是三角形本身 |
| CPU 对象更新 | 每个 Rig 遍历所有 parts；idle update 仍执行 `fx` | 需活动集合、可见性和距离调度 |
| 资源重复 | 每次 factory 新建所有 geometry/material | 需缓存、共享、合并或 instancing |
| 内容生产全靠代码 | 11 个模型各自手写约 150–262 行 | 需 schema、GLB adapter 与编辑器 |
| 审计边界 | 世界 AABB 与离散 resting poses | 不能替代碰撞、扫掠体和机械约束求解 |
| 状态集成缺失 | 无事件、snapshot、serialization、network contract | 游戏逻辑容易与视觉时间轴脱节 |
| 生产入口缺失 | CDN 静态页，无 build/test package | 需锁版本、构建与自动验收 |
