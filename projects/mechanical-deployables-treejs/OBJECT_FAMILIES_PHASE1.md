# 对象族生成第一阶段

## 目标

验证“一个大类包含多个小类对象，但全部复用同一运行契约”是否成立。R4 视觉优化后使用程序化 L2 资产，具备可检视的结构、材质和动作层次，但不以写实终版美术为验收目标。

```text
Family 大类
  -> Archetype 小类
  -> Parts 可寻址零件
  -> Clip 可检查动作
  -> State 上层可映射状态
```

每个对象统一返回上游 `Deployable` 契约：`root`、`parts`、`clips`、`duration()`、`setTime()`、`update()` 和 metadata。实现位于 [`showcase/object-families.mjs`](showcase/object-families.mjs)。

## 第一阶段目录

| 大类 | 小类 1 | 小类 2 | 小类 3 | 本阶段证明 |
| --- | --- | --- | --- | --- |
| 地面载具 | 侦察车 | 履带坦克 | 工程载具 | 底盘、传感器、武器和工具模块 |
| 飞行器 | 固定翼飞机 | 倾转旋翼机 | 四旋翼无人机 | 机翼、起落架、短舱和旋翼构型 |
| 机器人 | 巡检机器人 | 工业机械臂 | 双足机甲 | 移动底座、关节链和传感头 |
| 工业机械 | 龙门吊 | 钻削设备 | 输送线 | 结构、执行器、工具和载荷 |
| 基础设施 | 雷达站 | 模块方舱 | 部署桥梁 | 建筑部署、开合和工作反馈 |

总计：5 个大类、15 个小类对象。每个大类同时展示三个对象，并用同一个播放进度驱动各自的 `demo` clip。

## 复用层次

### 已复用

- Three.js 基础几何和 PBR 材质模式；
- `THREE.Group` 父子装配和局部 pivot；
- `createRig + seq + ch` 动画契约；
- 统一展厅播放、重置、选择和时间轴；
- `family / objectId / capability` metadata；
- 浏览器自动验收和可读 fallback。

### 尚未实现

- GLB/glTF 正式资产适配；
- socket 兼容矩阵和可替换零件；
- deploy、work、damage、destroy 多状态动作集；
- 可视化装配与时间线编辑器；
- 参数随机化、规则约束和批量导出；
- LOD、实例化和大规模对象调度；
- 物理、寻路、AI、战斗或工程仿真。

## 新增对象规则

一个新对象必须：

1. 属于一个明确 `family`；
2. 由命名 `parts` 组成，运动零件必须有正确 pivot；
3. 至少有一个可拖动、可复现的 `demo` clip；
4. 声明一条可观察的 `capability`，避免只做装饰动画；
5. 能被同一展厅控制，不新增对象专属全局循环；
6. 标注资产质量等级和不具备的仿真能力。

## 下一阶段建议

第二阶段不应继续无边界增加程序化模型，而应选择两个代表对象——履带坦克和工业机械臂——完成：

```text
正式 GLB 节点
+
统一 socket
+
deploy / work / damage / destroy
+
上层状态机事件
```

这能验证本阶段的程序化契约是否可以跨越到正式资产生产，而不是只在占位模型中成立。

## 验收

- `npm test`：调度器 8 项断言通过；四模式浏览器验收通过；
- 对象族目录为 5×3，当前大类始终显示 3 个对象；
- 播放后统一时间轴推进；切换大类恢复确定性起点；
- 证据截图：[`evidence/showcase-families.png`](evidence/showcase-families.png)。
- R4 增加完成态入口、hero/companion 构图、倒角几何、环境反射、三段展台和同族细节 LOD；记录见 [`VISUAL_REFINEMENT_R4.md`](VISUAL_REFINEMENT_R4.md)。
