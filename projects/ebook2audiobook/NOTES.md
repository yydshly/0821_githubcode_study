# ebook2audiobook 研究记录

## 2026-08-22：源码审阅与归档

### 研究问题

- 该项目的核心是自研能力，还是对成熟格式工具和开源TTS的工程整合？
- 不安装完整项目的情况下，哪些设计值得保留供后续二次开发？
- 它与已有“LLM分析 + MiniMax TTS”路线的差异是什么？

### 固定对象

- 上游仓库：`https://github.com/DrewThomasson/ebook2audiobook`
- 审阅提交：`4b182a3dc60e642901042de333b2f4e1b69dfe72`
- 许可证：Apache License 2.0
- 审阅方式：读取README、配置与核心Python实现；没有安装依赖、下载模型或运行音质基准。

### 重点审阅路径

| 路径 | 关注点 |
| --- | --- |
| `lib/conf.py` | 输入、声音和输出格式 |
| `lib/core.py` | 格式转换、OCR、EPUB解析、清洗、分句、缓存与音频流水线 |
| `lib/classes/non_text_filter.py` | 非正文和不可朗读内容过滤 |
| `lib/classes/tts_manager.py` | TTS统一调度入口 |
| `lib/classes/tts_registry.py` | 引擎注册机制 |
| `lib/conf_models.py` | 引擎、语言、资源和声音转换配置 |
| `lib/classes/tts_engines/` | XTTS、Bark、Piper、VITS、Fairseq等后端实现 |
| `lib/classes/voice_extractor.py` | 参考声音提取与预处理 |
| `components/E2A-SML/` | 可选角色/对白分析和SML脚本扩展 |

### 核心观察

1. 所有主要输入最终被规范为内部EPUB，再按spine中的XHTML文档生成block。
2. PDF、图片、PPTX和无文本DOCX存在专用提取/OCR分支，其余格式主要依赖Calibre。
3. 文本处理是规则、Stanza、num2words和语言映射组合，不是LLM语义清洗。
4. `TTSManager`是很薄的工厂/适配层；真正能力来自XTTS、Bark、Piper、VITS、MMS等上游模型。
5. XTTS等可以原生参考声音条件生成；Piper/VITS/MMS等指定新音色时多走“基础TTS + KNNVC声音转换”。
6. MMS/Fairseq的1000+语言来自大量按语言加载的单语言VITS模型，不代表一个模型统一掌握所有语言。
7. JSON、SQLite、block ID、哈希和逐句文件使断点恢复与编辑迁移成为该项目较有价值的工程部分。
8. 没有源到目标完整性评分、OCR置信度回退或TTS后ASR对齐，质量仍需人工预览兜底。

### 发现的实现风险

- PDF只要页面存在可提取文字就优先使用文字层，错误或不完整的隐藏文字层可能阻止OCR。
- PPTX在有任何文本时不会继续识别同页图片中的主要文字，且shape遍历顺序不保证视觉顺序。
- DOCX只在完全没有可提取文字时才对内嵌图片OCR，混合图文可能漏内容。
- 非正文过滤会主动删除代码、公式、URL和短句，适合小说但不适合保真教材。
- 根据`epub:type`排除附录、参考文献、前后置内容可能误删用户想听的章节。
- 当前审阅版本的EPUB纯图片正文分支会收集`ocr_parts`，但后续仍从原body生成`tuples_list`；归档中将其视为需要复测的潜在接线缺陷，不将该路径认定为已可靠闭环。

### 决策

- 归档，不安装，不复制上游源码。
- 现阶段继续采用LLM语义处理和MiniMax TTS。
- 出现明确离线、低成本批量、小语种或M4B生产需求时，重新评估单个模块。
- 后续自研以可追溯`Document IR`为核心，补充置信度、人工审核队列和ASR回验。

### 研究限制

本次结论是架构和源码级判断，没有覆盖实际安装成功率、不同GPU/CPU性能、各语言主观音质、长书稳定性以及最新模型权重的许可证差异。重新采用前必须用自有真实样本做小规模基准。
