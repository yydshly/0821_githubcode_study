# 必要扩展与路线

扩展目标不是继续增加模型数量，而是把“单个可审计 Rig”变成可被游戏资产管线、生命周期系统和大规模渲染安全使用的组件。

## 优先级结论

| 级别 | 方向 | 为什么必要 | 当前状态 |
| --- | --- | --- | --- |
| P0 | 许可与来源治理 | 无 LICENSE 时无法安全承诺派生和再分发 | 已识别，待上游明确 |
| P0 | 可复现构建与自动验收 | CDN Demo 不能作为受控游戏依赖 | 本研究补充 Playwright 验收，尚未改上游构建 |
| P0 | 多 Rig 生命周期调度 | 游戏不会永远只播放一个模型 | 已实现 FleetScheduler 原型 |
| P0 | 共享资源、静态合并与实例化 | 25 watchtower 已约 702 draw calls | 下一项必须验证 |
| P1 | 数据 schema + GLB 节点适配 | 手写几何无法支撑成熟美术团队产量 | 待设计 |
| P1 | 游戏状态、事件与 snapshot | 动画必须服从权威逻辑并可存档/联网恢复 | 待设计 |
| P1 | LOD、剔除与质量策略 | 大地图需要距离和设备分级 | Lab 已有阴影/像素比开关，未做动画 LOD |
| P2 | 物理损伤与模块玩法 | 扩大玩法价值，但不是基础可用性的前提 | 待研究 |
| P2 | AI 生成与自动修复 | 审计很适合作为生成闭环，但依赖稳定 schema | 规范已有基础 |

## 已探索：FleetScheduler

[`lab/fleet-scheduler.mjs`](lab/fleet-scheduler.mjs) 保持上游 contract 不变，在宿主侧增加：

- 多 Rig 注册；
- 部署/收回/摧毁的错峰计划；
- 仅更新正在播放的 Rig；
- 全部更新模式，便于对比 idle FX 成本；
- 全体 seek/reset 和活动/等待统计。

这证明“单 Rig 契约 + 外部调度器”是清晰边界：上游继续负责姿态与声音，游戏宿主负责谁在何时更新。

但实验也证明它只降低 CPU 更新，不降低 renderer 仍需绘制的 Mesh。因此它是必要条件，不是大规模方案的终点。

## 下一项必须探索：资源与渲染批处理

建议按以下顺序做证据原型：

1. **共享资源缓存**：同一 factory 的实例复用 immutable Geometry 与 Material；确认 dispose 引用计数。
2. **静止态合并**：部署完成后把不再活动的同材质零件合并，重新部署时切回分件 Rig。
3. **动画 LOD**：近景播放完整零件动画，中景播放分组动画，远景只做整体升起或状态切换。
4. **同类 Instancing**：对规模化相同建筑研究 transform texture / instanced attributes；不能直接把有层级关节的整套 Rig 当成单个 InstancedMesh。
5. **固定相机路线基准**：在独显、集显和移动设备记录 CPU frame、GPU frame、calls、triangles 与内存，而不是只记录 FPS。

验收目标不应先写死一个“最大实例数”，而应针对目标游戏的相机、阴影、屏幕占比和设备档建立预算。

## 生产资产方向：Schema + GLB adapter

长期不应要求美术人员用 JavaScript 写 `CylinderGeometry`。推荐资产边界：

```text
Blender / Maya 分件模型
        ↓ GLB 节点名与 pivot
GLB adapter 建立 parts
        ↓
JSON clips / sound / fx / audit flags
        ↓
现有 createRig contract
```

Schema 至少需要：

- `asset`、单位制、坐标轴、版本；
- part name/group/index、节点路径、explode offset；
- clip、sequence、channel、ease、appear/vanish、sound；
- socket/hinge/rail 等机械语义；
- LOD 与质量档；
- 可选游戏模块 id，而不是把玩法逻辑写入动画文件。

必须提供迁移工具把当前程序化模型导出或映射到同一 schema，否则会形成两套运行时。

## 游戏集成方向：权威状态和事件

建议新增宿主层状态机，而不是让按钮直接调用 `rig.play()`：

```text
stowed → deploying → active → retracting → stowed
                       ↓
                    destroyed
```

必要接口包括：

- `command(state, startedAt, speed)`：由游戏逻辑发起；
- `snapshot()` / `restore()`：存档和掉线恢复；
- sequence marker 事件：模块真正可用、碰撞体切换、声音与 VFX；
- 稳定 seed：销毁动画和程序 FX 在回放/联网客户端一致；
- seek 后事件策略：避免恢复存档时重复结算伤害或声音。

网络同步只传状态、开始时间、速度、变体和 seed，不逐帧传每个零件 transform。

## 审计扩展方向

现有四类 AABB 审计值得保留，并增加：

- clip 全时间采样或 swept volume，发现运动途中穿插；
- hinge/slider/socket 约束与 pivot 合理性；
- 三角形、材质、贴图、骨骼和 draw-call 预算；
- LOD 间状态一致性；
- GLB 节点命名、单位制和资源释放检查；
- 可访问性/减少动态效果模式，允许跳过长部署演出。

## 推荐里程碑

1. **M1：可控依赖**——澄清许可，加入本地 Three.js 依赖、构建和 CI 浏览器验收。
2. **M2：规模证据**——共享资源 + 静止态合并，对 1/10/50/100 实例建立多设备基线。
3. **M3：资产管线**——定义 schema，导入一个真实分件 GLB，并通过现有四类审计。
4. **M4：游戏闭环**——状态机、事件、snapshot、LOD 与确定性网络还原。
5. **M5：玩法深化**——模块损伤、物理残骸和 AI 生成/自动修复。
