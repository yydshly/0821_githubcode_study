# R5 参数化履带车辆生成器

## 设计契约

```text
Entry mode: Revision-led / continue
Request revision: R5 — 从浅层5×3对象展示收敛为一个可验证的履带车辆产品家族
Target user and context: 评估代码生成3D产品是否真正可行的技术负责人
Desired first impression: 三辆车明显共享同一底盘体系，但载荷、比例与用途不同
Visual ambition: Immersive prototype
Experience architecture: Spatial Stage
Scene base: WebGL + Three.js；DOM显示参数、规则与状态证据
Scene persistence: 参数化车辆和连续状态周期始终在场景中可见
Foreground control model: 保留对象族导航；地面载具显示生成参数、约束结果和连续周期控制
State-to-scene mapping: stowed → deploying → active/work → retracting → stowed，场景与状态标签同步
Mobile transformation: 参数摘要压缩为两行，保留播放与变体选择
Fallback: 保留现有可读fallback，不宣称其能显示3D生成结果
Visual constraints: 纯代码生成；不引入Blender、GLB或第三方模型；共享底盘必须可辨识
Information constraints: 明确哪些参数被生成器使用、哪些规则通过；不以材质装饰替代产品规则
Operation constraints: 三个预设可选择；完整周期可播放/暂停/重置；原有四模式不回归
State constraints: 所有转换由命名姿态生成；相邻状态端点必须相等；不得通过播放时跳姿态掩盖断点
Environment constraints: 静态Three.js 0.180；继续使用上游createRig契约
Primary journey: 进入地面载具 → 对比坦克/雷达车/工程车配置 → 聚焦一个变体 → 播放完整连续周期 → 查看规则与连续性结果
Required artifacts: 生成器源码、规则验证、浏览器桌面/移动证据、自动化测试、阶段文档
Autonomy authorization: 用户说“继续”，授权执行上一轮明确提出的履带车辆生成器闭环
User-decision boundary: 不扩展第二个产品家族，不引入工程级物理或外部资产
Observable completion criteria: 三个对象来自同一生成函数；配置不同可观察；共享底盘比例合法；动作周期无姿态跳变；参数与验证在UI可读；桌面/390px/fallback/原模式测试通过
```

## 基线

运行：`python -m http.server 8019`；URL：`http://127.0.0.1:8019/showcase/#families`；1440×960、390×844、深色主题；2026-08-22。

当前地面载具由 `groundScout`、`groundTank`、`groundEngineer` 三个独立 builder 手工搭建。它们共享展示接口，但不共享底盘算法、尺寸约束或状态姿态，因此不能证明“产品家族生成”。

## 覆盖清单

| 要求 | Surface / state | Evidence | Status | Next action |
| --- | --- | --- | --- | --- |
| 单一生成函数产生三变体 | source + browser | `createTrackedVehicle`、`tracked-vehicle-v1` metadata | pass | — |
| 产品比例规则可验证 | desktop / ground selected | 5/5 规则结果 + 25项单测断言 | pass | — |
| 连续状态周期 | stowed/deploy/work/retract | 四段状态条 + 端点连续性测试 | pass | — |
| 共享底盘与差异载荷可辨 | desktop / 3 variants | `evidence/showcase-families.png` | pass | — |
| 参数证据可读 | desktop + 390px | 参数、规则、周期 DOM + 两张截图 | pass | — |
| 原有模式与其他家族不回归 | all modes | Playwright 四模式全路径 | pass | — |
| 性能与fallback | WebGL + fallback | 三对象同屏、fallback 5段、0 console/page error | pass | — |

## 结果与边界

实现闭环为：`preset → normalize → validate → shared chassis → payload module → named poses → generated transitions → rig`。坦克、雷达车、工程车共享履带、负重轮、车体和载荷插槽算法；长度、宽度、轮数和载荷不同。UI直接显示输入参数、5项比例规则和状态连续性结果。

这证明的是“受约束产品族可由代码生成”，不是“任意一句话自动产生工业级车辆”。当前几何属于可运行的 L2 风格化模型，适合游戏原型、编辑器、配置器和仿真占位；若要达到写实商业资产质量，需要继续补充曲面语言、拓扑/UV、损伤层、悬挂/履带运动和碰撞/物理规则。Blender或GLB可以成为可选的高保真输出与美术修整环节，但不是本生成器成立的前提。

终审：本轮范围无 `continue`、无 `defer`、无 `blocked`。
