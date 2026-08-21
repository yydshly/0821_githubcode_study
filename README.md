# GitHub 能力研究实验室

这里用于持续研究 GitHub 与 X 上发现的有趣开源项目：复现关键能力、记录判断过程，并把可运行成果发布为在线演示。

[在线研究展厅](https://yydshly.github.io/0821_githubcode_study/) · [研究目录](projects/README.md) · [参与约定](CONTRIBUTING.md)

## 研究索引

| 项目 | 能力方向 | 状态 | 原项目 | 研究记录 | 在线演示 |
| --- | --- | --- | --- | --- | --- |
| H3 Prompt Journal | MiniMax H3 提示词工程、参考图分工、时间与物理约束 | `validated` | [上游仓库](https://github.com/LoveRain1997/h3-prompt-journal) | [完整分析](projects/h3-prompt-journal/) | [交互实验台](https://yydshly.github.io/0821_githubcode_study/demos/h3-prompt-journal/) |
| ZhuLink | 私人 RSS 阅读、公共内容推荐、透明热度排序 | `archived` | [上游仓库](https://github.com/TwoThreeWang/zhulink) | [案例整理](projects/zhulink-community-aggregation/) | 暂无 |

状态统一使用 `planned`、`researching`、`validated`、`archived`，方便快速判断研究进度。

## 仓库结构

```text
.
├─ README.md                  # 对外总入口与研究索引
├─ CONTRIBUTING.md            # 新增、更新研究项目的约定
├─ projects/
│  ├─ README.md               # 子项目导航与目录说明
│  └─ _template/              # 新研究项目的文档模板
├─ docs/                      # GitHub Pages 展示站点
│  ├─ index.html
│  ├─ styles.css
│  └─ demos/                  # 各研究项目的在线演示
└─ .github/
   ├─ ISSUE_TEMPLATE/         # 研究选题提案
   ├─ PULL_REQUEST_TEMPLATE.md
   └─ workflows/pages.yml     # Pages 自动部署
```

每个研究对象放在 `projects/<project-slug>/` 中，保持代码、实验记录和结论自包含；需要在线展示时，将可直接发布的静态内容放到 `docs/demos/<project-slug>/`，再从本页和展厅同时建立入口。

## 开始一个研究项目

1. 复制 `projects/_template/` 为 `projects/<project-slug>/`。
2. 在子项目 README 中登记来源、研究问题、运行方法、证据与结论。
3. 小步提交实验过程；不要只提交最终结果。
4. 有可运行网页时，把静态发布产物放入 `docs/demos/<project-slug>/`。
5. 更新本页研究索引和 `docs/index.html` 的展厅卡片。

## 展示方式

合并到 `main` 后，`.github/workflows/pages.yml` 会把 `docs/` 发布到 GitHub Pages。首次使用时，需要在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。

## 基本原则

- 尊重原项目许可证和署名要求，不把第三方源码当作本仓库原创成果。
- 结论必须能由代码、日志、截图或可复现实验支撑。
- 子项目优先保持独立，避免一个实验的依赖污染其他实验。
- 不提交密钥、令牌、账号数据、付费素材或大体积生成文件。
