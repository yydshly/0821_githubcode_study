# R4 对象族视觉优化记录

## 设计契约修订

```text
Entry mode: Revision-led
Request revision: R4 — 用户认为对象族效果太差，要求整体优化
Target user and context: 首次检查“代码生成3D对象族”是否值得继续投入的制作人/技术负责人
Desired first impression: 先看懂选中对象是什么，再看懂另外两个对象属于同一家族
Visual ambition: Immersive
Experience architecture: Spatial Stage
Scene base: WebGL + Three.js，DOM保留说明和操作
Scene persistence: 对象切换、播放和聚焦期间持续可见
Foreground control model: 顶部模式导航 + 右侧桌面面板 / 移动底部面板
State-to-scene mapping: 选中对象居中放大；同类对象退居两侧；播放状态同步进度和动作
Mobile transformation: 保留场景上半部，压缩标题与面板信息密度
Fallback: 继续保留 ?fallback=1 可读路径
Visual constraints: 深色工业展台；控制高亮不覆盖模型；不使用后处理掩盖几何缺陷
Information constraints: 首屏以对象为主，标题和控制面板降级；明确程序化资产等级
Operation constraints: 原有四模式、播放、重置、分类与对象选择保持可用
State constraints: 切换分类恢复确定性起点；selected / playing / reset 状态可辨识
Environment constraints: 静态 Three.js 0.180；不引入外部3D资产或后端
Primary journey: 进入对象族 → 选择大类 → 聚焦小类 → 播放动作 → 切换下一类
Required artifacts: 优化后的桌面/移动证据、自动化回归、更新后的设计记录
Autonomy authorization: 用户明确要求优化，可直接执行可逆的本地视觉与模型修改
User-decision boundary: 不采购或下载第三方模型，不改变对象族业务范围
Observable completion criteria: 对象轮廓和材质可辨；选中对象成为明确主角；三对象不互相挤压；桌面/390px无阻断；原有模式和fallback不回归；测试通过
```

## 基线与问题

运行环境：`python -m http.server 8019`，`http://127.0.0.1:8019/showcase/#families`，深色主题，1440×960 与 390×844，2026-08-22。

基线证据：`evidence/showcase-families.png`、`evidence/showcase-families-mobile.png`。

| 层次 | 基线观察 | 根因 | R4干预 | 状态 |
| --- | --- | --- | --- | --- |
| 构图 | 三对象尺寸相近并挤满横向空间 | 没有 hero / companion 层级 | 选中对象偏向可视中心并放大，另外两个缩小退居两侧 | pass |
| 焦点 | 大标题、青色底座和技术框比模型更抢眼 | 视觉权重倒置 | 缩小对象族标题、弱化底座、以选择光环替代包围盒 | pass |
| 几何 | 方块边缘锐利、机械轮廓像占位件 | 基础 BoxGeometry 缺少倒角与表面层次 | 全局圆角箱体、选中态边缘高光、15个对象补充辨识细节 | pass |
| 材质 | 深灰模型在深背景中粘连 | 缺少环境反射、粗糙度与主辅材质分离 | ACES、RoomEnvironment、分类色板与金属/玻璃/发光材质 | pass |
| 深度 | 地面、模型和背景缺乏空间分层 | 单一圆形地面与均匀照明 | 三段展台、背景墙、主辅灯和接触阴影 | pass |
| 移动端 | 大标题和面板占据过多高度 | 桌面信息密度直接压缩 | 移动专用标题、紧凑卡片和底部操作面板 | pass |

## 覆盖清单

| 要求 | Surface / state | Evidence | Status | Next action |
| --- | --- | --- | --- | --- |
| 对象视觉提升 | desktop / families / selected | `evidence/showcase-families.png` | pass | — |
| 家族层级清晰 | desktop / 5 families | 分类切换、完成态入口和聚焦观察 | pass | — |
| 动作仍可读 | desktop / playing / reset | Playwright 时间轴推进与切换 | pass | — |
| 移动端可操作 | 390×844 / families | `evidence/showcase-families-mobile.png`；无水平溢出 | pass | — |
| 原有模式不回归 | original / technical / story | Playwright 四模式全路径 | pass | — |
| reduced motion / fallback | reduce / ?fallback=1 | Playwright 能力降级路径 | pass | — |
| 性能无明显退化 | desktop / WebGL | 当前三对象约119 calls / 22,852 triangles；同族对象关闭细节边缘和阴影；动画采用0.12s上限时间步 | pass | 真实目标设备预算留给产品化阶段 |

## 结论

R4 将对象族从 L1 占位展示提升到 L2 可检视程序化原型。它仍不具备正式 GLB 的拓扑、纹理和近景质量，因此不声明 L3/L4；当前范围内没有 `continue`、`defer` 或 `blocked`。
