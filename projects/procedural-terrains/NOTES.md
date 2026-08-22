# 实验日志

## 2026-08-22 · GitHub Pages 正式发布

- main 集成提交：[`726203e`](https://github.com/yydshly/0821_githubcode_study/commit/726203e381d341d42c54afaebd6f8f77226aad72)。
- Pages 工作流：[`32549764057`](https://github.com/yydshly/0821_githubcode_study/actions/runs/32549764057)，结论 `success`。
- 研究展厅：<https://yydshly.github.io/0821_githubcode_study/demos/procedural-terrains/>。
- RTS 技术原型：<https://yydshly.github.io/0821_githubcode_study/demos/procedural-terrains/rts-map-profile/>。
- 线上验收：桌面研究展厅、RTS Seed 12345 重生成与战略视图、390×844 移动抽屉、强制 Canvas fallback 均为 HTTP 200，未捕获控制台或页面错误。
- 回滚点：发布前 main [`2491eff`](https://github.com/yydshly/0821_githubcode_study/commit/2491eff)。

## 2026-08-22 · 最终归档与选型修正

- 研究状态由 `researching` 调整为 `archived`，不再继续扩展当前原型。
- 最终架构判断：地形、地表、对象和游戏规则应分层管理，但由同一 MapRecipe、坐标系和遮罩依赖图统一驱动。
- RTS 地图应采用“战略骨架优先 → 地形服从 → CPU 规则编译 → 验证/拒绝 → 材质与植被”的流程，不能只用噪声地形再摆放资源。
- 100 Seed 诊断：出生点连通和资源可通行均为 100/100；可通行比例平均约 99.83%，说明当前路线与隘口缺少真实拓扑意义。
- 选型修正：红警类目标优先 OpenRA；通用 RTS 随机地图参考 0 A.D.；自然地理参考 Mapgen4；Procedural Terrains 保留为地形创作、视觉预览和资产输出模块。
- 0 A.D. 旧 GitHub 镜像归档不等于项目停止开发。当前开发已迁移至 `gitea.wildfiregames.com/0ad/0ad`，官方于 2026-02-18 发布 Release 28: Boiorix。
- 完整归档、恢复条件、远端演示地址和许可边界见 `ARCHIVE.md`。

发布候选重新验证：

- 固定上游：49 个测试文件、452 项测试全部通过；Vite 生产构建成功，保留大 chunk 警告作为风险记录。
- RTS 技术原型：4/4 测试通过；Vite 构建成功，主 JS 497.08 kB / gzip 129.08 kB。
- 静态链接检查：研究展厅和 RTS 子页面共 2 个 HTML，所有本地 `href/src` 均存在。
- 浏览器检查：桌面研究展厅、桌面 RTS、390×844 移动抽屉、强制 Canvas fallback 四条路径均返回 HTTP 200，无页面或控制台错误。
- 发布证据截图保存在本地 `.tmp/procedural-terrains-release-evidence/`，不提交临时 QA 产物。

## 2026-08-22 · RTS Map Profile 原型

- 在 `projects/procedural-terrains/rts-map-profile/` 新建独立 Vite + Three.js 原型，没有修改固定上游子模块。
- 实现 65×65 确定性高度网格、双阵营镜像、基地平整、两条主路线、两个隘口、6 个资源点、通行与建造网格。
- 数据层和可视化层分离；WebGL 不可用时可通过 `?fallback=1` 使用 Canvas 2D 战术图并继续导出 JSON。
- `npm test`：4/4 通过，覆盖 Seed 复现、镜像、出生点语义和导出结构。
- `npm run build`：成功；主 JS 497.08 kB，gzip 129.08 kB；输出进入研究展厅静态目录。
- 浏览器验证：默认/战略图层、Seed 12345 重生成、JSON 下载、390×844 抽屉焦点和 Escape、强制回退、研究页入口到静态构建均通过。
- 结论边界：已证明“地形 → RTS 地图语义数据”的小型生产闭环，没有证明具体游戏运行时寻路、建造、战斗或地图协议兼容。

## 2026-08-22

### 假设

ProceduralTerrains 不只是视觉演示，而是具备稳定测试、确定性地形规则和生产导出路径的可研究工具链；其核心能力可以与 React 产品界面分开理解。

### 操作

1. 以 Git 子模块添加 `ZyFou/ProceduralTerrains`，固定到提交 `b378e0e2df66678a44df4edc057dda05436f0b59`。
2. 使用 Three.js 静态探针扫描框架、renderer、render loop、Shader、instancing、controls、GUI 与导出入口。
3. 使用锁文件执行 `npm ci`。
4. 并行执行 `npm test` 与 `npm run build`。
5. 根据源码入口、上游说明、测试与构建结果整理能力图。

### 环境

- Windows 10.0.26200
- Node.js 22.15.0
- npm 10.9.2
- 上游应用版本 1.5.2

### 结果

- 静态探针扫描 319 个源码类文件，识别到独立 WebGL renderer、引擎循环、Shader/实例化路径、三套相机/世界控制以及地形导出模块。
- 49 个测试文件、452 项测试全部通过，Vitest 总耗时 6.79 秒。
- Vite 构建成功：2200 个模块，18.90 秒。
- 主要构建输出包括 `Engine` 765.56 kB（gzip 209.74 kB）、入口 561.02 kB（gzip 151.92 kB）和 Three.js 521.04 kB（gzip 134.47 kB）。构建给出 chunk 超过 500 kB 警告。
- 首次依赖安装因受限环境无法写用户 npm cache；切换到工作区 cache 后确认下载还需要网络许可。获准联网后，同一锁文件安装成功。这属于研究环境问题，不是上游缺陷。

### 有界结论

- 自动化证据足以确认逻辑测试与生产编译健康。
- 源码结构支持“React 产品层 / Three.js 引擎层”的边界判断。
- 尚未完成浏览器视觉回归、移动真机性能、长时流送和目标引擎导入，因此不能宣称生产性能或跨引擎输出已经验证。

### 下一步

- 建立固定浏览器场景和截图基线。
- 对三种世界模式采集加载与帧时间数据。
- 验证实时地形与导出资产的一致性。

### 研究展厅修订

用户把研究入口明确为四章：能力展示、技术原理、使用场景、扩展方向；随后补充要求不得遗漏上游内置样例。

执行结果：

- 从固定提交本地运行时采集 Tile、Infinite World Plane 和 Planet 稳定帧；首次进入 Infinite World 与 Planet 都观察到可感知的 Shader 编译等待。
- 完整盘点上游创作起点：Procedural、Nodes、Manual Terrain、Real Terrain 四种入口；5 个程序化模板；8 个节点配方。
- 节点配方清单与 `NodeProjectTemplates.test.js` 对照：上游会逐配方验证图可达性、诊断、容量和实时编译。
- 建立纯静态研究展厅 `docs/demos/procedural-terrains/`，正文不依赖完整上游编辑器或后端。
- 浏览器检查覆盖 1440×900、900×1000 和 390×844；修复了窄屏 sticky header 定位和手机标题单字换行。
- 最终检查：所有本地页面、CSS、JS 与图片 HTTP 200；无破损图片、错误覆盖层或横向溢出；键盘标签切换和 reduced-motion 通过。
- 上游 Vite 日志出现可选账户 API 的 analytics/session 代理 `ECONNREFUSED`，原因是研究范围未启动 Node.js/MySQL API；这没有阻止 local-first 编辑器和三模式运行。静态研究展厅不包含这些请求。

后续“探索”不再补页面结构，而应进入有数据的专题实验：优先测量三模式首次 Shader 编译与模式级拆包/预热收益，其次验证固定 seed 的实时画面到导出资产一致性。
