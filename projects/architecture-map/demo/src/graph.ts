import type { ArchitectureData } from '../../upstream/architecture-map/assets/components/ArchitectureMap'
import type { Archetype, ArchetypeParams } from '../../upstream/architecture-map/assets/core/archetypes'
import { deriveArchetype, deriveHeight, deriveSize, packLayout } from '../../upstream/architecture-map/assets/core/layout'
import type { ArchEdge, ArchFlow, ArchNode, Group } from '../../upstream/architecture-map/assets/core/types'
import { MEASURED, UNCLAIMED } from './measured.generated'

const GROUPS: readonly Group[] = [
  { id: 'control', label: '研究入口与规则', color: '#2563eb' },
  { id: 'cases', label: '已完成研究项目', color: '#7c3aed' },
  { id: 'experiments', label: '实验与证据', color: '#d97706' },
  { id: 'publication', label: '展厅与发布', color: '#059669' },
  { id: 'outside', label: 'GitHub 外部世界', color: '#64748b' },
]

type Draft = Pick<ArchNode, 'id' | 'code' | 'name' | 'role' | 'group' | 'whatItDoes' | 'howItsBuilt' | 'files' | 'stack'> & {
  archetype?: Archetype
  params?: ArchetypeParams
}

const DRAFTS: readonly Draft[] = [
  {
    id: 'governance', code: 'RG', name: '研究总纲', role: '研究方法与项目索引', group: 'control',
    whatItDoes: '定义这个仓库为什么存在、研究项目如何组织，以及结论必须由什么证据支撑。',
    howItsBuilt: '根 README 提供公开入口，CONTRIBUTING 约束目录、状态、复现命令和许可证记录。',
    files: ['README.md', 'CONTRIBUTING.md', 'projects/README.md'], stack: ['Markdown', 'Git'], archetype: 'tower',
  },
  {
    id: 'proposals', code: 'PR', name: '选题与评审', role: '研究项目入口', group: 'control',
    whatItDoes: '通过 Research proposal 和 PR 模板收集研究问题、预期产物与验证证据。',
    howItsBuilt: '把立项和合并检查写成 GitHub 模板，减少只有收藏、没有复现的项目。',
    files: ['.github/ISSUE_TEMPLATE/research-proposal.yml', '.github/PULL_REQUEST_TEMPLATE.md'], stack: ['GitHub Issues', 'Pull Requests'], archetype: 'low-slab',
  },
  {
    id: 'template', code: 'TP', name: '研究模板', role: '统一研究骨架', group: 'control',
    whatItDoes: '为新子项目提供元信息、研究问题、范围、运行方法、验证证据和结论结构。',
    howItsBuilt: 'README 与 NOTES 保持最小组合，让每个新研究对象都能独立复现。',
    files: ['projects/_template/README.md', 'projects/_template/NOTES.md'], stack: ['Markdown'], archetype: 'low-slab',
  },
  {
    id: 'h3', code: 'H3', name: 'H3 Prompt Journal', role: '视频提示词研究档案', group: 'cases',
    whatItDoes: '研究 MiniMax H3 的参考图分工、时间约束、动作连续性和物理可信度。',
    howItsBuilt: '六类策略各保留真实生成记录、提示词、结果元数据、验证结论和失败诊断。',
    files: ['projects/h3-prompt-journal/ANALYSIS.md', 'projects/h3-prompt-journal/VALIDATION.md', 'projects/h3-prompt-journal/ARCHIVE.md'],
    stack: ['MiniMax H3', 'Python', 'Markdown'], archetype: 'slab-stack', params: { levels: 5 },
  },
  {
    id: 'zhulink', code: 'ZL', name: 'ZhuLink', role: 'RSS 社区案例', group: 'cases',
    whatItDoes: '研究私人 RSS 阅读、用户主动推荐和公共热度排序如何组合成内容社区。',
    howItsBuilt: '以代码阅读和产品链路分析为主，明确记录低互动环境下热度排序退化的问题。',
    files: ['projects/zhulink-community-aggregation/README.md', 'projects/zhulink-community-aggregation/NOTES.md'], stack: ['RSS', 'Product analysis'],
  },
  {
    id: 'moovie', code: 'MV', name: 'Moovie 研究', role: '视频来源策略档案', group: 'cases',
    whatItDoes: '研究点播与直播能力究竟由播放器、来源数量、来源有效率还是换源策略决定。',
    howItsBuilt: '先建立研究契约，再用可控样例、公开来源与故障注入逐项验证。',
    files: ['projects/moovie-video-playback/README.md', 'projects/moovie-video-playback/DESIGN.md', 'projects/moovie-video-playback/ARCHIVE.md'],
    stack: ['HLS', 'JavaScript', 'Source strategy'], archetype: 'slab-stack', params: { levels: 4 },
  },
  {
    id: 'architecture-map', code: 'AM', name: 'Architecture Map', role: '本次架构地图研究', group: 'cases',
    whatItDoes: '验证 Agent Skill 能否把真实代码库转成可交互的架构逻辑地图，并检查文档漂移。',
    howItsBuilt: '本地复现使用固定上游 React/SVG 组件；公开 Pages 版本采用独立静态 SVG 实现，避免重新发布未许可的上游代码。',
    files: ['projects/architecture-map/README.md', 'projects/architecture-map/EXTENSIONS.md', 'docs/demos/architecture-map/app.js'],
    stack: ['Codex Skill', 'React', 'SVG', 'Vanilla JS', 'Vite'], archetype: 'tower',
  },
  {
    id: 'h3-demo', code: 'HD', name: 'H3 真实生成展', role: '六组生成证据', group: 'experiments',
    whatItDoes: '把 H3 六种参考图策略的提示词、海报、视频和结论整理成可浏览归档。',
    howItsBuilt: '静态页面直接引用真实输出素材，读者可以在结论旁查看对应证据。',
    files: ['docs/demos/h3-prompt-journal/index.html', 'docs/demos/h3-prompt-journal/app.js', 'docs/demos/h3-prompt-journal/styles.css'],
    stack: ['Static HTML', 'Generated media'], archetype: 'fin-row', params: { count: 6 },
  },
  {
    id: 'moovie-lab', code: 'ML', name: 'Moovie 实验室', role: '可执行来源实验', group: 'experiments',
    whatItDoes: '运行来源匹配、换源、HLS 播放、公开目录和故障注入实验。',
    howItsBuilt: '浏览器实验台、轻量本地服务、确定性 fixtures 与端到端检查共同生成证据。',
    files: ['projects/moovie-video-playback/lab/app.js', 'projects/moovie-video-playback/lab/pipeline.js', 'projects/moovie-video-playback/lab/tests/browser-check.cjs'],
    stack: ['JavaScript', 'HLS.js', 'Browser tests'], archetype: 'fin-row', params: { count: 12 },
  },
  {
    id: 'moovie-report', code: 'MR', name: 'Moovie 归档结论', role: '来源研究结论页', group: 'experiments',
    whatItDoes: '把播放器只是终端、来源配置决定平台能力的研究结论整理成静态页面。',
    howItsBuilt: '从完整实验室提炼可独立阅读的结论，不复制运行时后端能力。',
    files: ['docs/demos/moovie-source-research/index.html', 'docs/demos/moovie-source-research/styles.css'], stack: ['Static HTML'],
  },
  {
    id: 'gallery', code: 'GA', name: '研究展厅', role: '公开研究索引', group: 'publication',
    whatItDoes: '集中展示 H3、ZhuLink、Moovie 和 Architecture Map 的状态、结论与入口。',
    howItsBuilt: '纯静态首页链接到研究记录与可运行演示，适合直接由 GitHub Pages 托管。',
    files: ['docs/index.html', 'docs/styles.css'], stack: ['GitHub Pages', 'Static HTML'], archetype: 'tower',
  },
  {
    id: 'pages-pipeline', code: 'CI', name: 'Pages 发布流水线', role: '静态发布装配器', group: 'publication',
    whatItDoes: '在 main 分支变化后组装 docs 与 Moovie 实验室，并发布到 GitHub Pages。',
    howItsBuilt: 'Actions 检出子模块、组装 `_site`、上传 Pages artifact，再执行正式部署。',
    files: ['.github/workflows/pages.yml'], stack: ['GitHub Actions', 'GitHub Pages'], archetype: 'low-slab',
  },
  {
    id: 'upstream-github', code: 'GH', name: '上游 GitHub 项目', role: '外部研究对象来源', group: 'outside',
    whatItDoes: '提供 H3 Prompt Journal、ZhuLink、Moovie 和 Architecture Map 的原始代码与版本历史。',
    howItsBuilt: '它位于本仓库之外，所以地图只显示边界节点，不伪造本地代码规模。',
    files: [], stack: ['GitHub'], archetype: 'low-slab',
  },
  {
    id: 'public-site', code: 'WEB', name: '公开研究站点', role: '最终读者入口', group: 'outside',
    whatItDoes: '向读者提供在线研究展厅、归档演示和可以亲手体验的实验成果。',
    howItsBuilt: '由 GitHub Pages 托管 Actions 生成的静态 artifact。',
    files: [], stack: ['GitHub Pages'], archetype: 'low-slab',
  },
]

const prepared = DRAFTS.map((draft) => {
  const measure = MEASURED[draft.id] ?? { count: 0, loc: 0 }
  const derived = deriveArchetype(measure)
  const archetype = draft.archetype ?? derived.archetype
  const params = draft.params ?? derived.params
  return { draft, measure, archetype, params, size: deriveSize(archetype, params, measure) }
})

const footprints = packLayout(
  prepared.map((entry) => ({ item: entry.draft.id, group: entry.draft.group, size: entry.size })),
  GROUPS.map((group) => group.id),
)

const NODES: readonly ArchNode[] = prepared.map(({ draft, measure, archetype, params }) => ({
  ...draft, archetype, params, footprint: footprints.get(draft.id)!, height: deriveHeight(measure), count: measure.count, loc: measure.loc,
}))

const EDGES: readonly ArchEdge[] = [
  { id: 'rules-proposal', from: 'governance', to: 'proposals', kind: 'support', label: '选题与证据规则', flowIds: ['new-study'] },
  { id: 'proposal-template', from: 'proposals', to: 'template', kind: 'data', label: '研究问题与范围', flowIds: ['new-study'] },
  { id: 'template-archmap', from: 'template', to: 'architecture-map', kind: 'support', label: '研究项目骨架', flowIds: ['new-study'] },
  { id: 'upstream-archmap', from: 'upstream-github', to: 'architecture-map', kind: 'data', label: '固定上游 Skill', flowIds: [] },
  { id: 'archmap-gallery', from: 'architecture-map', to: 'gallery', kind: 'data', label: '已验证研究入口', flowIds: ['new-study'] },
  { id: 'upstream-h3', from: 'upstream-github', to: 'h3', kind: 'data', label: 'H3 提示词仓库', flowIds: ['h3-archive'] },
  { id: 'h3-demo', from: 'h3', to: 'h3-demo', kind: 'data', label: '六组真实生成证据', flowIds: ['h3-archive'] },
  { id: 'h3-gallery', from: 'h3-demo', to: 'gallery', kind: 'data', label: 'H3 归档演示入口', flowIds: ['h3-archive'] },
  { id: 'upstream-moovie', from: 'upstream-github', to: 'moovie', kind: 'data', label: 'Moovie v4 源码', flowIds: ['moovie-study'] },
  { id: 'moovie-lab', from: 'moovie', to: 'moovie-lab', kind: 'call', label: '来源与换源假设', flowIds: ['moovie-study'] },
  { id: 'lab-report', from: 'moovie-lab', to: 'moovie-report', kind: 'data', label: '浏览器与故障证据', flowIds: ['moovie-study'] },
  { id: 'report-gallery', from: 'moovie-report', to: 'gallery', kind: 'data', label: 'Moovie 结论入口', flowIds: ['moovie-study'] },
  { id: 'upstream-zhulink', from: 'upstream-github', to: 'zhulink', kind: 'data', label: 'ZhuLink 源码', flowIds: ['zhulink-case'] },
  { id: 'zhulink-gallery', from: 'zhulink', to: 'gallery', kind: 'data', label: 'RSS 社区案例入口', flowIds: ['zhulink-case'] },
  { id: 'gallery-ci', from: 'gallery', to: 'pages-pipeline', kind: 'call', label: 'docs 与实验产物', flowIds: ['new-study', 'h3-archive', 'moovie-study', 'zhulink-case'] },
  { id: 'ci-public', from: 'pages-pipeline', to: 'public-site', kind: 'data', label: 'Pages artifact', flowIds: ['new-study', 'h3-archive', 'moovie-study', 'zhulink-case'] },
]

const FLOWS: readonly ArchFlow[] = [
  { id: 'new-study', name: '新增研究项目', payload: '研究问题与证据', summary: '从研究规则、选题和模板进入本次 Architecture Map 研究，再登记到展厅并发布。', route: ['rules-proposal', 'proposal-template', 'template-archmap', 'archmap-gallery', 'gallery-ci', 'ci-public'] },
  { id: 'h3-archive', name: 'H3 真实生成结项', payload: '六组生成证据', summary: '从上游提示词研究进入真实生成展，最终归档到公开研究站点。', route: ['upstream-h3', 'h3-demo', 'h3-gallery', 'gallery-ci', 'ci-public'] },
  { id: 'moovie-study', name: 'Moovie 来源实验', payload: '来源与故障证据', summary: '从上游源码进入可执行实验室，提炼结论页并发布到展厅。', route: ['upstream-moovie', 'moovie-lab', 'lab-report', 'report-gallery', 'gallery-ci', 'ci-public'] },
  { id: 'zhulink-case', name: 'ZhuLink 案例归档', payload: 'RSS 社区案例', summary: '从上游源码提炼产品链路案例，再登记到公开研究索引。', route: ['upstream-zhulink', 'zhulink-gallery', 'gallery-ci', 'ci-public'] },
]

export const ARCHITECTURE: ArchitectureData = {
  groups: GROUPS, nodes: NODES, edges: EDGES, flows: FLOWS, unmapped: UNCLAIMED,
  repo: 'GitHub 能力研究实验室 / 真实项目地图',
  intro: {
    title: '这是我们已经做过的研究项目',
    lede: 'H3 · ZhuLink · Moovie · Architecture Map · GitHub Pages',
    whatItDoes: '每栋建筑都对应当前仓库里的真实研究记录、实验代码、静态演示或发布配置。点击左侧流程，可以看到一个开源项目如何从[[上游代码]]变成研究证据和公开成果。',
    howItsBuilt: '模块说明与研究流程依据当前仓库编写；文件数、代码行数、建筑高度、布局和未覆盖文件直接扫描现有项目，不再使用虚构样例。',
  },
}
