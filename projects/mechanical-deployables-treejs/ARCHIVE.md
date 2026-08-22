# Mechanical Deployables 研究归档

归档日期：2026-08-22

研究状态：`archived`

上游固定提交：`f9d757d36c64ef45aaf9aca94f81bc73e59bf0d5`

## 一句话结论

该项目证明了“程序化零件层级 + 声明式 transform clip + 审计规则”可以快速构建可解释的低模机械部署动画；但不值得继续沿“用手写基础几何生产更多模型”的路线投入。3D生成模型将优先替代外观网格、材质和普通资产制作，长期有价值的是部件语义、插槽、关节、状态、约束、物理、LOD和运行时协议。

## 已验证能力

- 固定并运行上游11个程序化机械模型；统计133个逻辑零件、259个Mesh、约24,776个三角形、34个clips和609条sequence。
- 验证 `root + parts + clips + metadata` 作为最小Rig协议，可以支持部署、收拢、声音、FX和几何审计。
- 实现 `FleetScheduler`，验证错峰启动和“仅活动Rig更新”可以控制CPU生命周期，但不能解决draw call线性增长。
- 建立四入口研究展示：上游原作、技术解剖、产品故事、5×3对象族。
- 建立纯代码参数化履带车辆实验：共享底盘生成坦克、雷达车和工程车，包含比例规则与连续状态周期。
- 桌面、390px移动端、键盘、reduced-motion和无WebGL fallback自动验收通过。

## 最终判断

| 研究方向 | 判断 | 原因 |
| --- | --- | --- |
| 用Three.js基础几何继续雕更多外观 | 停止 | 最容易被图像/文本到3D模型替代，质量与效率上限明显 |
| 程序化母型生成风格化原型 | 保留 | 适合RTS占位、配置器、教学和快速概念验证 |
| 单张图片直接变成可用游戏资产 | 观察 | 生成网格进展快，但分件、拓扑、关节、碰撞与授权仍不稳定 |
| 机械对象描述语言与验证器 | 值得重启 | 几何来源可替换，结构、行为和运行时规则仍然必要 |
| 大规模游戏运行时 | 有明确项目再做 | 需要围绕LOD、instancing、物理、寻路、网络和存档重新立项 |
| 工业/军工数字孪生 | 不以本项目为底座 | 必须使用工程CAD、真实参数、验证数据与合规流程，当前原型不具备可信度 |

## 技术原理摘要

```text
配置/代码
  → 创建Three.js零件层级
  → 为零件注册稳定名称
  → clip声明时间、目标零件和transform通道
  → 每帧插值position / rotation / scale
  → 状态、声音、FX和审计读取同一Rig协议
```

参数化履带实验进一步把流程改为：

```text
preset
  → normalize
  → validate
  → shared chassis
  → payload module
  → named poses
  → generated transitions
  → runtime rig
```

这证明的是“受约束产品族可以由代码生成”，不是“任意一句话可以生成工业级机械产品”。

## 相关开源项目

### 实时运行与物理

| 项目 | 作用 | 适用边界 |
| --- | --- | --- |
| [Three.js](https://github.com/mrdoob/three.js) | WebGL/WebGPU场景、材质、动画和交互 | 运行时，不负责自动生成合理机械结构 |
| [React Three Fiber](https://github.com/pmndrs/react-three-fiber) | React声明式Three.js宿主 | 改善产品工程组织，不提高模型真实性 |
| [Rapier](https://github.com/dimforge/rapier) | 刚体、碰撞和关节物理 | 需要显式碰撞体、质量和约束输入 |
| [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh) | 射线与空间查询加速 | 优化查询，不减少材质和draw call |

### 代码建模与CAD

| 项目 | 作用 | 适用边界 |
| --- | --- | --- |
| [JSCAD](https://github.com/jscad/OpenJSCAD.org) | JavaScript参数化实体和CSG | 最适合纯Web母型，但不是动画/游戏引擎 |
| [CadQuery](https://github.com/CadQuery/cadquery) | Python + OCCT参数化CAD | 精确零件和STEP输出，通常离线执行 |
| [build123d](https://github.com/gumyr/build123d) | Python BREP代码CAD | 适合产品零件，需要额外转换到游戏格式 |
| [OpenSCAD](https://github.com/openscad/openscad) | 程序员导向的实体建模 | 简单可靠，复杂装配与曲面能力有限 |

### 图片/文本到3D

| 项目 | 作用 | 适用边界 |
| --- | --- | --- |
| [TripoSR](https://github.com/VAST-AI-Research/TripoSR) | 单图快速生成3D网格 | 适合外观草模，不生成可靠部件和关节 |
| [Hunyuan3D 2.1](https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1) | 高质量形状与PBR材质 | GPU和许可成本需单独评估；仍需游戏资产处理 |
| [TRELLIS](https://github.com/microsoft/TRELLIS) | 图像/文本到多种3D表示 | 适合资产候选，不等于可运行机械对象 |
| [PartGen](https://silent-chen.github.io/PartGen/) | 部件级3D生成与重建 | 研究前沿，说明结构化生成正在取代融合网格 |

### 自然语言到结构化3D

| 项目 | 作用 | 适用边界 |
| --- | --- | --- |
| [CAD-Coder](https://github.com/anniedoris/CAD-Coder) | 图片生成CadQuery代码 | 研究原型，复杂装配稳定性不足 |
| [Chat3D](https://github.com/kreuzhofer/chat3d-app) | 对话生成build123d CAD并预览 | 更适合单体零件，不负责游戏行为 |
| [Text2CAD](https://github.com/MLYengineering/Text2CAD) | 合同驱动的语言到FreeCAD流水线 | 强调确定性验证，但仍是研究级工程原型 |
| [Blender MCP](https://github.com/ahujasid/blender-mcp) | 让LLM操控Blender建模、场景和动画 | 是工具桥，不是机械正确性模型 |
| [Infinigen](https://github.com/princeton-vl/infinigen) | 全程序化自然/室内世界生成 | 世界生成能力强，但依赖Blender且不面向机械游戏产品 |

### 结构化和可动资产前沿

| 项目 | 作用 | 对本研究的启示 |
| --- | --- | --- |
| [UniRig](https://github.com/VAST-AI-Research/UniRig) | 自动预测骨骼层级与蒙皮 | 绑定工作会被模型显著自动化 |
| [Articulate Anything](https://github.com/vlongle/articulate-anything) | 从文本/视觉推断可动物体 | 关节候选可生成，但仍需要验证 |
| [PAct](https://github.com/Mobiuslqm/PAct) | 单图生成分件、外观和关节参数 | 表明模型会逐步吸收分件与运动结构 |

## 后期可扩展方向

只有在出现明确产品需求时，建议沿以下优先级重启：

1. **生成资产适配器**：接收GLB/OBJ/URDF，自动识别部件候选、生成碰撞体和LOD。
2. **Mechanical DSL**：用JSON/YAML描述母型、插槽、关节、状态、约束和行为；LLM只负责把自然语言翻译为DSL。
3. **确定性验证器**：检查尺寸、穿模、关节范围、重心、碰撞、状态连续性和性能预算。
4. **混合资产流水线**：AI生成外观，程序规则完成装配、动作和运行时接入。
5. **游戏运行时**：围绕instancing、批量动画、Rapier物理、寻路、网络同步和存档建立独立项目。

不建议继续的方向：扩大手写基础几何对象数量、把当前样例包装成“世界模拟器”、或在没有真实工程数据时宣称可用于工业/军工仿真。

## 归档与许可边界

上游固定提交未提供LICENSE。GitHub仓库仅以子模块记录来源和版本；公开Pages展厅只发布本研究的文字、统计和截图，并链接上游官方页面，不复制或部署上游源码。许可证缺失不等于允许修改和再分发。

本地研究代码和验证方法保留用于复现。若未来重启，必须首先重新检查上游许可证、生成模型权重许可证和目标资产的商业使用权。
