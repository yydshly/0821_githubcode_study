# Mechanical Deployables Tree.js 研究

> 已归档：研究一种“可审计的机械部署动画语言”，并验证它从单模型展示走向游戏多实例运行时所需的扩展。

## 元信息

| 字段 | 内容 |
| --- | --- |
| 状态 | `archived`（2026-08-22） |
| 原项目 | [trungdq88/mechanical-deployables-treejs](https://github.com/trungdq88/mechanical-deployables-treejs) |
| 上游版本 | `f9d757d36c64ef45aaf9aca94f81bc73e59bf0d5`（2026-08-18） |
| 开始日期 | 2026-08-22 |
| 上游演示 | [Mechanical Deployables](https://trungdq88.github.io/mechanical-deployables-treejs/) |
| 主演示 | [`showcase/`](showcase/)：原作复现、技术解剖、“极夜前哨”产品故事与对象族生成实验 |
| 性能实验 | [`lab/`](lab/)：多实例部署与舰队调度 |
| 上游许可证 | **未提供 LICENSE，使用与再分发权利待确认** |

完整收口结论、相关开源库和重启条件见[研究归档](ARCHIVE.md)。公开Pages仅展示研究结论与截图，不部署无许可证的上游源码。

## 研究问题

1. 它究竟是模型库、动画库还是规范？
2. 哪些能力属于可复用引擎，哪些只是单页展示？
3. 用于 RTS、塔防或大型 3D 场景时，CPU、draw call、资产生产和状态同步分别缺什么？
4. 哪个扩展方向应最先用运行证据验证？

成功标准：固定上游提交；跑通全部模型；记录模型规模与审计结果；实现一个不修改上游源码的多实例宿主扩展；明确下一阶段的性能与生产管线优先级。

## 当前结论

- 它不是传统 GLB 模型包，而是“程序化低模零件 + 声明式 transform clip + 声音/FX + 四类几何审计”的小型 Rig 协议。
- 11 个模型共 133 个逻辑零件、259 个 Mesh、约 24,776 个三角形、34 个 clips 和 609 条 sequence；单体几何量轻，零件级 draw call 才是多实例风险。
- 全部 11 个模型在固定提交上通过 contract、provenance、overlap、exposure、attachment 检查；上游页面和新增实验室均无浏览器控制台错误。
- 新增 [`FleetScheduler`](lab/fleet-scheduler.mjs) 证明错峰启动和“仅活动 Rig 更新”可以在不改变上游契约的情况下实现；它解决 CPU 生命周期管理，不解决 draw call。
- 新增三段式 [`showcase`](showcase/)：第一段直接运行未修改的上游 Gallery，第二段把真实部署时间点拆成七个技术步骤，第三段把五个设施编排成六章“极夜前哨”故事。
- 新增对象族第一阶段：5 个大类、15 个小类对象共享 `root + parts + demo clip + metadata`，证明地面载具、飞行器、机器人、工业机械和基础设施可由同一运行契约驱动；详见[对象族第一阶段](OBJECT_FAMILIES_PHASE1.md)。
- R4 将对象族从 L1 占位展示提升为 L2 可检视原型：圆角机械几何、分层材质、环境反射、三段展台、完成态入口和 hero/companion 构图；详见[视觉优化记录](VISUAL_REFINEMENT_R4.md)。
- 9 个 watchtower 在实验场景中约 254 draw calls / 32,716 triangles，25 个约 702 / 90,764，表明当前工厂创建方式近似线性扩张。FPS 来自无头软件渲染，不可外推到真实玩家设备。
- 在进入正式产品前必须先确认上游许可；许可证缺失不等于允许复制、修改或再分发。

详细证据见[能力图](CAPABILITY_MAP.md)、[扩展路线](EXTENSIONS.md)、[故事与产品架构](SHOWCASE_ARCHITECTURE.md)和[运行基线](evidence/RUNTIME_BASELINE.md)。

## 快速开始

初始化上游子模块：

```powershell
git submodule update --init --recursive
```

运行上游：

```powershell
cd projects/mechanical-deployables-treejs/upstream
python -m http.server 8018
```

打开 `http://127.0.0.1:8018/`。

运行研究演示与扩展实验室：

```powershell
cd projects/mechanical-deployables-treejs
python -m http.server 8019
```

- 主演示：`http://127.0.0.1:8019/showcase/`
- 多实例实验室：`http://127.0.0.1:8019/lab/`
- 可读 fallback：`http://127.0.0.1:8019/showcase/?fallback=1`

运行验证：

```powershell
cd projects/mechanical-deployables-treejs
npm install
npx playwright install chromium
npm test
```

## 范围

### 包含

- 上游源码、运行时契约、11 个模型、审计器、声音与销毁动画分析；
- 浏览器运行和交互验证；
- 多实例生命周期调度与渲染规模实验；
- 原作复现、技术分步与产品故事导演模式；
- 5×3 程序化对象族生成与统一时间轴演示；
- 游戏使用场景、生产风险与扩展优先级。

### 不包含

- 宣称当前无头环境 FPS 代表桌面或移动设备性能；
- 把上游改造成完整游戏引擎；
- 在许可明确前发布包含上游源码的派生在线版本；
- GLB 导入器、GPU instancing 或网络同步的完整实现。

## 目录

```text
mechanical-deployables-treejs/
├─ upstream/                 # 固定提交的 Git 子模块
├─ showcase/                 # 原作、原理、产品故事、对象族四模式演示
├─ lab/                      # 舰队级扩展原型
├─ tests/                    # 调度器与浏览器验收
├─ evidence/                 # 运行基线与截图
├─ CAPABILITY_MAP.md         # 能力边界
├─ EXTENSIONS.md             # 必要扩展与路线
├─ SHOWCASE_ARCHITECTURE.md  # 从场景到故事/产品的方法
├─ OBJECT_FAMILIES_PHASE1.md # 5×3 对象族清单、契约与下一阶段
└─ NOTES.md                  # 实验日志
```

## 来源与许可

上游仓库由 `trungdq88` 发布。本研究保留上游为独立 Git 子模块，不修改其提交。固定提交没有 `LICENSE` 文件，README 也未声明许可证；在权利人补充许可前，本项目只记录研究证据与独立宿主实验，不把上游源码作为可自由复用资产发布。
