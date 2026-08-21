# 研究项目目录

`projects/` 保存各个研究对象的源码、实验和结论。每个项目应尽可能自包含，并通过自己的 README 让后来者能够复现实验。

## 当前项目

| 项目 | 状态 | 研究记录 | 在线演示 |
| --- | --- | --- | --- |
| H3 Prompt Journal | `validated` | [能力分析](h3-prompt-journal/) | [交互实验台](https://yydshly.github.io/0821_githubcode_study/demos/h3-prompt-journal/) |

## 推荐布局

```text
projects/<project-slug>/
├─ README.md       # 项目来源、研究目标、运行方式与结论
├─ NOTES.md        # 按时间追加的实验日志
├─ src/            # 最小复现或实现代码（按需）
├─ tests/          # 验证代码（按需）
└─ assets/         # 小型截图或图表（按需）
```

从 [`_template/`](_template/) 复制起步模板，删除不适用的段落即可。
