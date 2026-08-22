# 展示体验设计合同

## Contract

```text
Entry mode: Revision-led
Request revision: R5 — 将地面载具收敛为纯代码参数化产品家族和连续状态周期
Target user and context: 游戏制作人、技术美术、前端/图形工程师；首次了解该仓库
Desired first impression: 原作保持真实；对象族模式首先看懂选中对象及其家族差异，而不是看到占位几何和技术框
Visual ambition: Immersive
Experience architecture: Spatial Stage
Scene base: WebGL + Three.js；DOM 承担可读说明和控制
Scene persistence: 技术解剖与产品故事持续显示；原作入口显示固定上游 iframe
Foreground control model: 顶部四入口导航；右侧/移动底部控制面板；故事字幕与对象族目录
State-to-scene mapping: 原作、技术步骤、故事章节、对象大类/小类、fallback 均同时更新场景和文字
Mobile transformation: 右侧面板转换为底部紧凑面板
Fallback: ?fallback=1 提供无需 WebGL 的技术与故事文本路径
Visual constraints: 深色工业展台；青色表示激活，琥珀表示机械过程；对象轮廓、接地、材质层次优先于装饰
Information constraints: 首屏只解释当前入口；技术细节按步骤展开；故事用产品结果而非 API 名称命名
Operation constraints: 鼠标/触控操作；导航、步骤和故事控制均可键盘到达
State constraints: 模式切换必须停止上一模式导演状态；reset 可恢复确定性起点
Environment constraints: 纯静态页面；Three.js 0.180.0 CDN；上游保持子模块原样
Primary journey: 原作部署 → 技术分步 → 产品故事 → 对象族 → 检查履带车辆参数、规则与连续状态周期
User-defined phases: 1 原有效果；2 技术原理与扩展；3 场景到故事/产品；4 大类到小类对象生成
Required artifacts: showcase 页面、架构说明、桌面/移动/fallback/状态截图、自动验收
Autonomy authorization: 用户已要求直接完善三项内容，可执行可逆的本地实现与验证
User-decision boundary: 不创建真实品牌、后端、商业发布或修改上游代码
Observable completion criteria: 四入口可切换；对象族为 5×3；地面三对象由单一参数化生成器产生并显示参数/规则/连续周期；原有三模式无回归；fallback 可读；测试通过
```

## Coverage manifest

| 用户阶段 | 要求 | Surface / state | Evidence | Stage | Status |
| --- | --- | --- | --- | --- | --- |
| 第一 | 原作真实效果可见可操作 | desktop / original | `showcase-original.png`；iframe 11 模型；deploy 时间推进 | 5 | `pass` |
| 第二 | 技术实现可分步理解 | desktop / technical | `showcase-technical.png`；第六步姿态、目标和通道一致 | 5 | `pass` |
| 第二 | 扩展边界清晰 | document | `SHOWCASE_ARCHITECTURE.md` | 9 | `pass` |
| 第三 | 场景形成产品故事 | desktop / story | `showcase-story.png`；六章、自动推进、reset | 5 | `pass` |
| 第四 | 大类到小类对象生成 | desktop / families | `showcase-families.png`；5×3 目录、统一契约和时间轴 | 5 | `pass` |
| R4 | 对象族视觉质量优化 | desktop + 390px / families | hero/companion、L2材质舞台、完成态入口、桌面/移动证据 | 2-8 | `pass` |
| R5 | 参数化履带车辆产品族 | desktop + 390px / ground | 单一生成器、三套配置、共享底盘、5/5规则、四段连续周期 | 2-9 | `pass` |
| 跨面 | 移动端保持场景与控制 | 390×844 | `showcase-mobile.png`；无水平溢出 | 7 | `pass` |
| 跨面 | 键盘可到达入口和主操作 | desktop / keyboard | 原作 Tab 到技术，Enter 激活 | 7 | `pass` |
| 跨面 | reduced motion 不隐藏信息 | emulated reduce | media query 命中；章节信息同步更新 | 7 | `pass` |
| 跨面 | WebGL fallback 可读 | `?fallback=1` | fallback 五段可见、spatial display none | 8 | `pass` |
| 工程 | 原有 fleet lab 不回归 | `/lab/` | 9/25 rigs 验收继续通过 | 9 | `pass` |
| 工程 | showcase 自动验收 | `/showcase/` | Playwright 全路径通过、0 console/page error | 9 | `pass` |

主题边界：本轮只支持深色工业主题，不声明浅色主题。语言边界：中文主界面，短英文技术标签仅作辅助。

终审：无 `continue`、无 `defer`、无 `blocked`；R4 对象族视觉优化范围关闭。上游许可问题仍是公开再分发的项目级边界，不阻断本地研究展示。
