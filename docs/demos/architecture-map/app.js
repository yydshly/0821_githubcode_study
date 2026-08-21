const NS = 'http://www.w3.org/2000/svg'
const TILE_W = 48
const TILE_H = 28
const ELEV = 18
const ORIGIN = { x: 520, y: 150 }

const GROUPS = [
  { id: 'control', label: '研究入口与规则', color: '#2563eb' },
  { id: 'cases', label: '已完成研究项目', color: '#7c3aed' },
  { id: 'experiments', label: '实验与证据', color: '#d97706' },
  { id: 'publication', label: '展厅与发布', color: '#059669' },
  { id: 'outside', label: 'GitHub 外部世界', color: '#64748b', flagSide: 'right' },
]

const NODES = [
  { id: 'governance', code: 'RG', name: '研究总纲', group: 'control', gx: 7, gy: 1, w: 2, d: 2, h: 2.3, kind: 'tower', files: 3, loc: 340, role: '研究方法与项目索引', summary: '定义研究项目如何组织，以及结论必须由什么证据支撑。', sources: ['README.md', 'CONTRIBUTING.md', 'projects/README.md'], stack: ['Markdown', 'Git'] },
  { id: 'proposals', code: 'PR', name: '选题与评审', group: 'control', gx: 10.5, gy: 1, w: 3, d: 2, h: 1.2, files: 2, loc: 160, role: '研究项目入口', summary: '通过 Research proposal 和 PR 模板收集问题、范围和预期证据。', sources: ['.github/ISSUE_TEMPLATE/research-proposal.yml', '.github/PULL_REQUEST_TEMPLATE.md'], stack: ['GitHub Issues', 'Pull Requests'] },
  { id: 'template', code: 'TP', name: '研究模板', group: 'control', gx: 7.5, gy: 4.5, w: 3, d: 2, h: 1.3, files: 2, loc: 120, role: '统一研究骨架', summary: '提供研究问题、运行方法、验证证据和结论的最小结构。', sources: ['projects/_template/README.md', 'projects/_template/NOTES.md'], stack: ['Markdown'] },

  { id: 'h3', code: 'H3', name: 'H3 Prompt Journal', group: 'cases', gx: 16, gy: 4, w: 3, d: 3, h: 4.8, kind: 'stack', levels: 4, files: 24, loc: 1564, role: '视频提示词研究档案', summary: '研究参考图分工、时间约束、动作连续性和物理可信度。', sources: ['projects/h3-prompt-journal/ANALYSIS.md', 'projects/h3-prompt-journal/VALIDATION.md', 'projects/h3-prompt-journal/ARCHIVE.md'], stack: ['MiniMax H3', 'Python', 'Markdown'] },
  { id: 'zhulink', code: 'ZL', name: 'ZhuLink', group: 'cases', gx: 13, gy: 7.5, w: 2.5, d: 2, h: 2.1, files: 2, loc: 260, role: 'RSS 社区案例', summary: '解释私人阅读、用户推荐和公共热度排序如何组合。', sources: ['projects/zhulink-community-aggregation/README.md', 'projects/zhulink-community-aggregation/NOTES.md'], stack: ['RSS', 'Product analysis'] },
  { id: 'moovie', code: 'MV', name: 'Moovie 研究', group: 'cases', gx: 17, gy: 8.5, w: 3, d: 3, h: 3.8, kind: 'stack', levels: 3, files: 4, loc: 820, role: '视频来源策略档案', summary: '研究播放能力如何由来源有效率、覆盖丰富度和换源策略决定。', sources: ['projects/moovie-video-playback/README.md', 'projects/moovie-video-playback/DESIGN.md', 'projects/moovie-video-playback/ARCHIVE.md'], stack: ['HLS', 'JavaScript', 'Source strategy'] },
  { id: 'architecture-map', code: 'AM', name: 'Architecture Map', group: 'cases', gx: 13, gy: 10.5, w: 2.5, d: 2.5, h: 5, kind: 'tower', files: 16, loc: 2570, role: '本次架构地图研究', summary: '验证大模型能否把真实代码库转换成可交互的架构逻辑地图。', sources: ['projects/architecture-map/README.md', 'projects/architecture-map/EXTENSIONS.md', 'docs/demos/architecture-map/app.js'], stack: ['Codex Skill', 'React', 'SVG', 'Vanilla JS'] },

  { id: 'moovie-lab', code: 'ML', name: 'Moovie 实验室', group: 'experiments', gx: 0, gy: 8, w: 10, d: 2, h: 5, kind: 'fins', count: 10, files: 23, loc: 5750, role: '可执行来源实验', summary: '运行来源匹配、换源、HLS 播放和故障注入实验。', sources: ['projects/moovie-video-playback/lab/app.js', 'projects/moovie-video-playback/lab/pipeline.js', 'projects/moovie-video-playback/lab/tests/browser-check.cjs'], stack: ['JavaScript', 'HLS.js', 'Browser tests'] },
  { id: 'h3-demo', code: 'HD', name: 'H3 真实生成展', group: 'experiments', gx: 0, gy: 11.5, w: 6, d: 2, h: 5, kind: 'fins', count: 6, files: 9, loc: 4829, role: '六组生成证据', summary: '把六种参考图策略的提示词、海报、视频和结论整理成可浏览证据。', sources: ['docs/demos/h3-prompt-journal/index.html', 'docs/demos/h3-prompt-journal/app.js', 'docs/demos/h3-prompt-journal/styles.css'], stack: ['Static HTML', 'Generated media'] },
  { id: 'moovie-report', code: 'MR', name: 'Moovie 归档结论', group: 'experiments', gx: 7.5, gy: 11.5, w: 3, d: 2, h: 2.2, files: 2, loc: 540, role: '来源研究结论页', summary: '把来源配置决定平台能力的实验结论整理成静态页面。', sources: ['docs/demos/moovie-source-research/index.html', 'docs/demos/moovie-source-research/styles.css'], stack: ['Static HTML'] },

  { id: 'gallery', code: 'GA', name: '研究展厅', group: 'publication', gx: 11, gy: 15, w: 3, d: 2, h: 3, files: 2, loc: 690, role: '公开研究索引', summary: '集中展示研究状态、结论、记录和可以亲手体验的成果。', sources: ['docs/index.html', 'docs/styles.css'], stack: ['GitHub Pages', 'Static HTML'] },
  { id: 'pages-pipeline', code: 'CI', name: 'Pages 发布流水线', group: 'publication', gx: 15.5, gy: 15, w: 3, d: 2, h: 1.5, files: 1, loc: 70, role: '静态发布装配器', summary: '组装 docs 和研究实验，并发布为 GitHub Pages 站点。', sources: ['.github/workflows/pages.yml'], stack: ['GitHub Actions', 'GitHub Pages'] },

  { id: 'upstream-github', code: 'GH', name: '上游 GitHub 项目', group: 'outside', gx: -2, gy: 15, w: 3, d: 2, h: 1.6, files: 0, loc: 0, role: '外部研究对象来源', summary: '提供各研究对象的原始代码与版本历史。', sources: [], stack: ['GitHub'] },
  { id: 'public-site', code: 'WEB', name: '公开研究站点', group: 'outside', gx: 2, gy: 17.5, w: 3, d: 2, h: 1.4, files: 0, loc: 0, role: '最终读者入口', summary: '向读者提供在线展厅、归档演示和实验成果。', sources: [], stack: ['GitHub Pages'] },
]

const EDGES = [
  { id: 'rules-proposal', from: 'governance', to: 'proposals', kind: 'support', label: '选题与证据规则' },
  { id: 'proposal-template', from: 'proposals', to: 'template', kind: 'data', label: '研究问题与范围' },
  { id: 'template-archmap', from: 'template', to: 'architecture-map', kind: 'support', label: '研究项目骨架' },
  { id: 'upstream-archmap', from: 'upstream-github', to: 'architecture-map', kind: 'data', label: '固定上游 Skill' },
  { id: 'archmap-gallery', from: 'architecture-map', to: 'gallery', kind: 'data', label: '已验证研究入口' },
  { id: 'upstream-h3', from: 'upstream-github', to: 'h3', kind: 'data', label: 'H3 提示词仓库' },
  { id: 'h3-demo', from: 'h3', to: 'h3-demo', kind: 'data', label: '六组真实生成证据' },
  { id: 'h3-gallery', from: 'h3-demo', to: 'gallery', kind: 'data', label: 'H3 归档演示入口' },
  { id: 'upstream-moovie', from: 'upstream-github', to: 'moovie', kind: 'data', label: 'Moovie v4 源码' },
  { id: 'moovie-lab', from: 'moovie', to: 'moovie-lab', kind: 'call', label: '来源与换源假设' },
  { id: 'lab-report', from: 'moovie-lab', to: 'moovie-report', kind: 'data', label: '浏览器与故障证据' },
  { id: 'report-gallery', from: 'moovie-report', to: 'gallery', kind: 'data', label: 'Moovie 结论入口' },
  { id: 'upstream-zhulink', from: 'upstream-github', to: 'zhulink', kind: 'data', label: 'ZhuLink 源码' },
  { id: 'zhulink-gallery', from: 'zhulink', to: 'gallery', kind: 'data', label: 'RSS 社区案例入口' },
  { id: 'gallery-ci', from: 'gallery', to: 'pages-pipeline', kind: 'call', label: 'docs 与实验产物' },
  { id: 'ci-public', from: 'pages-pipeline', to: 'public-site', kind: 'data', label: 'Pages artifact' },
]

const FLOWS = [
  { id: 'new-study', name: '新增研究项目', payload: '研究问题与证据', summary: '从研究规则、选题和模板进入 Architecture Map 研究，再登记到展厅并发布。', route: ['rules-proposal', 'proposal-template', 'template-archmap', 'archmap-gallery', 'gallery-ci', 'ci-public'] },
  { id: 'h3-archive', name: 'H3 真实生成结项', payload: '六组生成证据', summary: '从上游提示词研究进入真实生成展，最终归档到公开研究站点。', route: ['upstream-h3', 'h3-demo', 'h3-gallery', 'gallery-ci', 'ci-public'] },
  { id: 'moovie-study', name: 'Moovie 来源实验', payload: '来源与故障证据', summary: '从上游源码进入可执行实验室，提炼结论页并发布到展厅。', route: ['upstream-moovie', 'moovie-lab', 'lab-report', 'report-gallery', 'gallery-ci', 'ci-public'] },
  { id: 'zhulink-case', name: 'ZhuLink 案例归档', payload: 'RSS 社区案例', summary: '从上游源码提炼产品链路案例，再登记到公开研究索引。', route: ['upstream-zhulink', 'zhulink-gallery', 'gallery-ci', 'ci-public'] },
]

const groupById = new Map(GROUPS.map((group) => [group.id, group]))
const nodeById = new Map(NODES.map((node) => [node.id, node]))
const edgeById = new Map(EDGES.map((edge) => [edge.id, edge]))
const edgeElements = new Map()
const buildingElements = new Map()
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const state = {
  lens: 'visual',
  selectedNode: null,
  activeFlow: null,
  playing: false,
  startedAt: 0,
  elapsed: 0,
  segmentIndex: 0,
  raf: 0,
}

function svg(tag, attrs = {}) {
  const element = document.createElementNS(NS, tag)
  for (const [name, value] of Object.entries(attrs)) {
    if (value !== undefined && value !== null) element.setAttribute(name, String(value))
  }
  return element
}

function iso(gx, gy, z = 0) {
  return {
    x: ORIGIN.x + (gx - gy) * (TILE_W / 2),
    y: ORIGIN.y + (gx + gy) * (TILE_H / 2) - z * ELEV,
  }
}

function points(pointsList) {
  return pointsList.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ')
}

function mix(hexA, hexB, weightB) {
  const parse = (hex) => [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16))
  const a = parse(hexA)
  const b = parse(hexB)
  const channel = (index) => Math.round(a[index] * (1 - weightB) + b[index] * weightB).toString(16).padStart(2, '0')
  return `#${channel(0)}${channel(1)}${channel(2)}`
}

function boxFaces(fp, z0, z1) {
  const a1 = iso(fp.gx, fp.gy, z1)
  const b1 = iso(fp.gx + fp.w, fp.gy, z1)
  const c1 = iso(fp.gx + fp.w, fp.gy + fp.d, z1)
  const d1 = iso(fp.gx, fp.gy + fp.d, z1)
  const b0 = iso(fp.gx + fp.w, fp.gy, z0)
  const c0 = iso(fp.gx + fp.w, fp.gy + fp.d, z0)
  const d0 = iso(fp.gx, fp.gy + fp.d, z0)
  return [
    { shade: 'left', points: [d1, c1, c0, d0] },
    { shade: 'right', points: [b1, c1, c0, b0] },
    { shade: 'top', points: [a1, b1, c1, d1] },
  ]
}

function buildingFaces(node) {
  if (node.kind === 'fins') {
    const count = node.count || 4
    const pitch = node.w / count
    return Array.from({ length: count }, (_, index) => boxFaces({ gx: node.gx + index * pitch, gy: node.gy, w: pitch * .58, d: node.d }, 0, node.h)).flat()
  }
  if (node.kind === 'stack') {
    const levels = node.levels || 3
    const step = node.h / levels
    return Array.from({ length: levels }, (_, index) => {
      const pad = index * .18
      return boxFaces({ gx: node.gx + pad, gy: node.gy + pad, w: node.w - pad * 2, d: node.d - pad * 2 }, index * step, (index + 1) * step)
    }).flat()
  }
  return boxFaces(node, 0, node.h)
}

function nodeCenter(node, front = false) {
  return front
    ? { gx: node.gx + node.w / 2, gy: node.gy + node.d }
    : { gx: node.gx + node.w / 2, gy: node.gy + node.d / 2 }
}

function districtBounds(groupId) {
  const members = NODES.filter((node) => node.group === groupId)
  const minGx = Math.min(...members.map((node) => node.gx)) - .8
  const minGy = Math.min(...members.map((node) => node.gy)) - .8
  const maxGx = Math.max(...members.map((node) => node.gx + node.w)) + .8
  const maxGy = Math.max(...members.map((node) => node.gy + node.d)) + 1.3
  return { gx: minGx, gy: minGy, w: maxGx - minGx, d: maxGy - minGy }
}

function renderDistricts() {
  const plateLayer = document.querySelector('#district-layer')
  const labelLayer = document.querySelector('#label-layer')
  GROUPS.forEach((group) => {
    const rect = districtBounds(group.id)
    const corners = [
      iso(rect.gx, rect.gy),
      iso(rect.gx + rect.w, rect.gy),
      iso(rect.gx + rect.w, rect.gy + rect.d),
      iso(rect.gx, rect.gy + rect.d),
    ]
    plateLayer.append(svg('polygon', {
      class: 'district-plate',
      points: points(corners),
      fill: mix(group.color, '#ffffff', .9),
      stroke: mix(group.color, '#64748b', .45),
      'data-group': group.id,
    }))

    // Most flags sit on the front-left edge. The outside-world district is the
    // one exception because its left edge reaches beyond the SVG viewBox.
    const flagGx = group.flagSide === 'right' ? rect.gx + rect.w - .2 : rect.gx + .2
    const at = iso(flagGx, rect.gy + rect.d - .2)
    const width = Math.max(84, group.label.length * 12 + 18)
    const flag = svg('g', { class: 'district-label', transform: `translate(${at.x} ${at.y - 22})` })
    flag.append(svg('line', { x1: 0, y1: 0, x2: 0, y2: 22, stroke: group.color, 'stroke-width': 1.4 }))
    flag.append(svg('rect', { x: 0, y: -17, width, height: 21, rx: 4, stroke: group.color }))
    const text = svg('text', { x: 8, y: -6, fill: group.color })
    text.textContent = group.label
    flag.append(text)
    labelLayer.append(flag)
  })
}

function renderEdges() {
  const layer = document.querySelector('#edge-layer')
  EDGES.forEach((edge) => {
    const from = nodeById.get(edge.from)
    const to = nodeById.get(edge.to)
    const a = nodeCenter(from, true)
    const b = nodeCenter(to, true)
    const route = [a, { gx: b.gx, gy: a.gy }, b].map((point) => iso(point.gx, point.gy))
    const path = svg('path', {
      id: `edge-${edge.id}`,
      class: 'edge-path',
      d: `M ${route.map((point) => `${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' L ')}`,
      'data-edge': edge.id,
      'data-kind': edge.kind,
      'marker-end': edge.kind === 'support' ? null : 'url(#arrow)',
    })
    const title = svg('title')
    title.textContent = edge.label
    path.append(title)
    layer.append(path)
    edgeElements.set(edge.id, path)
  })
}

function renderBuildings() {
  const layer = document.querySelector('#building-layer')
  const sorted = [...NODES].sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy) || a.gx - b.gx)
  sorted.forEach((node, paintIndex) => {
    const group = groupById.get(node.group)
    const root = svg('g', {
      class: 'building',
      role: 'button',
      tabindex: '0',
      'aria-label': `${node.name}，${node.role}`,
      'data-node': node.id,
      'data-group': node.group,
      'data-paint-index': paintIndex,
    })
    const faceColors = {
      top: mix(group.color, '#ffffff', .77),
      left: mix(group.color, '#ffffff', .58),
      right: mix(group.color, '#334155', .34),
    }
    buildingFaces(node).forEach((face) => {
      root.append(svg('polygon', {
        points: points(face.points),
        fill: faceColors[face.shade],
        stroke: mix(group.color, '#334155', .5),
      }))
    })

    const anchor = iso(node.gx + node.w / 2, node.gy + node.d / 2, node.h)
    const chipWidth = Math.max(30, node.code.length * 8 + 14)
    const chip = svg('g', { class: 'roof-chip', transform: `translate(${anchor.x} ${anchor.y - 16})` })
    chip.append(svg('rect', { x: -chipWidth / 2, y: -9, width: chipWidth, height: 18, rx: 5, stroke: group.color }))
    const chipText = svg('text', { x: 0, y: 3, 'text-anchor': 'middle', fill: group.color })
    chipText.textContent = node.code
    chip.append(chipText)
    root.append(chip)

    const title = svg('title')
    title.textContent = `${node.name} · ${node.files} files · ~${node.loc.toLocaleString('en-US')} lines`
    root.append(title)
    root.addEventListener('click', () => selectNode(node.id))
    root.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        selectNode(node.id)
      }
    })
    layer.append(root)
    buildingElements.set(node.id, root)
  })
}

function renderControls() {
  const flowList = document.querySelector('#flow-list')
  FLOWS.forEach((flow) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'flow-button'
    button.dataset.flow = flow.id
    button.setAttribute('aria-pressed', 'false')
    const name = document.createElement('strong')
    name.textContent = flow.name
    const payload = document.createElement('small')
    payload.textContent = flow.payload
    button.append(name, payload)
    button.addEventListener('click', () => selectFlow(flow.id))
    flowList.append(button)
  })

  const legend = document.querySelector('#group-legend')
  GROUPS.forEach((group) => {
    const item = document.createElement('div')
    item.className = 'legend-item'
    const dot = document.createElement('span')
    dot.className = 'legend-dot'
    dot.style.background = group.color
    item.append(dot, document.createTextNode(group.label))
    legend.append(item)
  })

  document.querySelectorAll('.lens-button').forEach((button) => {
    button.addEventListener('click', () => {
      state.lens = button.dataset.lens
      state.selectedNode = null
      document.querySelectorAll('.lens-button').forEach((candidate) => {
        const active = candidate === button
        candidate.classList.toggle('is-active', active)
        candidate.setAttribute('aria-pressed', String(active))
      })
      renderState()
    })
  })

  document.querySelector('#play-button').addEventListener('click', togglePlay)
  document.querySelector('#clear-button').addEventListener('click', clearState)
  window.addEventListener('keydown', (event) => {
    const target = event.target
    const typing = target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
    if (event.key === 'Escape') clearState()
    if (event.key === ' ' && state.activeFlow && !typing) {
      event.preventDefault()
      togglePlay()
    }
  })
}

function selectNode(nodeId) {
  state.selectedNode = state.selectedNode === nodeId ? null : nodeId
  renderState()
}

function selectFlow(flowId) {
  cancelAnimationFrame(state.raf)
  if (state.activeFlow === flowId) {
    state.activeFlow = null
    state.playing = false
  } else {
    state.activeFlow = flowId
    state.selectedNode = null
    state.elapsed = 0
    state.segmentIndex = 0
    state.playing = !prefersReducedMotion
    state.startedAt = performance.now()
  }
  renderState()
  if (state.playing) state.raf = requestAnimationFrame(tick)
}

function togglePlay() {
  if (!state.activeFlow || prefersReducedMotion) return
  if (state.playing) {
    state.elapsed += performance.now() - state.startedAt
    state.playing = false
    cancelAnimationFrame(state.raf)
  } else {
    const flow = FLOWS.find((item) => item.id === state.activeFlow)
    const total = flow.route.length * 1250
    if (state.elapsed >= total) state.elapsed = 0
    state.startedAt = performance.now()
    state.playing = true
    state.raf = requestAnimationFrame(tick)
  }
  renderState()
}

function clearState() {
  cancelAnimationFrame(state.raf)
  state.selectedNode = null
  state.activeFlow = null
  state.playing = false
  state.elapsed = 0
  state.segmentIndex = 0
  renderState()
}

function flowNodeIds(flow) {
  const ids = new Set()
  flow.route.forEach((edgeId) => {
    const edge = edgeById.get(edgeId)
    ids.add(edge.from)
    ids.add(edge.to)
  })
  return ids
}

function tick(now) {
  if (!state.playing || !state.activeFlow) return
  const flow = FLOWS.find((item) => item.id === state.activeFlow)
  const elapsed = state.elapsed + now - state.startedAt
  const segmentDuration = 1250
  const total = flow.route.length * segmentDuration
  if (elapsed >= total) {
    state.elapsed = total
    state.playing = false
    state.segmentIndex = flow.route.length - 1
    renderState()
    return
  }
  state.segmentIndex = Math.floor(elapsed / segmentDuration)
  const progress = (elapsed % segmentDuration) / segmentDuration
  updateFlowVisual(flow, progress)
  state.raf = requestAnimationFrame(tick)
}

function updateFlowVisual(flow, progress = 0) {
  edgeElements.forEach((element, id) => {
    const index = flow ? flow.route.indexOf(id) : -1
    element.classList.toggle('is-route', index >= 0)
    element.classList.toggle('is-visited', index >= 0 && index < state.segmentIndex)
    element.classList.toggle('is-flow', index === state.segmentIndex)
  })

  const dotLayer = document.querySelector('#flow-layer')
  dotLayer.replaceChildren()
  if (!flow || prefersReducedMotion) return
  const edgeId = flow.route[Math.min(state.segmentIndex, flow.route.length - 1)]
  const path = edgeElements.get(edgeId)
  if (!path) return
  const length = path.getTotalLength()
  const point = path.getPointAtLength(length * progress)
  dotLayer.append(svg('circle', { class: 'flow-dot', cx: point.x, cy: point.y, r: 6 }))
}

function renderState() {
  const flow = FLOWS.find((item) => item.id === state.activeFlow) || null
  const routeNodes = flow ? flowNodeIds(flow) : null
  buildingElements.forEach((element, nodeId) => {
    element.classList.toggle('is-selected', state.selectedNode === nodeId)
    element.classList.toggle('is-dimmed', Boolean(routeNodes && !routeNodes.has(nodeId)))
    if (flow) {
      const currentEdge = edgeById.get(flow.route[state.segmentIndex])
      element.classList.toggle('is-current', Boolean(currentEdge && currentEdge.to === nodeId))
    } else {
      element.classList.remove('is-current')
    }
  })

  document.querySelectorAll('.flow-button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.flow === state.activeFlow))
  })

  const playButton = document.querySelector('#play-button')
  playButton.disabled = !flow || prefersReducedMotion
  playButton.textContent = prefersReducedMotion && flow ? '已显示' : state.playing ? '暂停' : '播放'
  updateFlowVisual(flow, 0)
  renderDetail(flow)
}

function renderDetail(flow) {
  const panel = document.querySelector('#detail-content')
  const selected = nodeById.get(state.selectedNode)
  if (selected) {
    panel.innerHTML = `
      <p class="eyebrow">SELECTED MODULE</p>
      <h2>${selected.name}</h2>
      <p class="detail-lede">${selected.files} files · ~${selected.loc.toLocaleString('en-US')} lines · ${selected.role}</p>
      <p class="detail-copy">${selected.summary}</p>
      <section class="detail-section"><h3>Built with</h3><div class="detail-pills">${selected.stack.map((item) => `<span>${item}</span>`).join('')}</div></section>
      <section class="detail-section"><h3>Source evidence</h3><ul>${selected.sources.length ? selected.sources.map((source) => `<li>${source}</li>`).join('') : '<li>外部边界节点，不伪造本地代码规模</li>'}</ul></section>
    `
    return
  }
  if (flow) {
    panel.innerHTML = `
      <p class="eyebrow">ACTIVE FLOW · ${state.segmentIndex + 1}/${flow.route.length}</p>
      <h2>${flow.name}</h2>
      <p class="detail-lede">载荷：${flow.payload}</p>
      <p class="detail-copy">${flow.summary}</p>
      <section class="detail-section"><h3>Route</h3><ul>${flow.route.map((edgeId, index) => `<li>${String(index + 1).padStart(2, '0')} · ${edgeById.get(edgeId).label}</li>`).join('')}</ul></section>
    `
    return
  }
  if (state.lens === 'understanding') {
    panel.innerHTML = `
      <p class="eyebrow">UNDERSTANDING ENTRY</p>
      <h2>带着问题读项目</h2>
      <p class="detail-lede">入口 · 证据 · 流程 · 追问</p>
      <p class="detail-copy">项目理解不是让用户独自浏览全部建筑，而是先选择一个问题，再由地图突出相关模块与证据。</p>
      <section class="detail-section"><h3>Recommended questions</h3><ul><li>项目整体由哪些领域组成？</li><li>一个研究项目如何成为公开成果？</li><li>代码如何构建并发布？</li><li>修改一个模块会影响哪些流程？</li></ul></section>
    `
  } else {
    panel.innerHTML = `
      <p class="eyebrow">VISUAL LANGUAGE</p>
      <h2>把代码仓库画成城市</h2>
      <p class="detail-lede">颜色 · 体量 · 关系 · 动画</p>
      <p class="detail-copy">颜色区分领域，建筑代表模块，高度表达规模，道路表达关系，移动载荷说明真实流程。大模型负责理解语义，程序负责校验数据并稳定渲染。</p>
      <section class="detail-section"><h3>Reading order</h3><ul><li>先用颜色识别五个领域</li><li>再用建筑体量判断模块规模</li><li>选择流程观察模块如何协作</li><li>点击建筑查看真实源码证据</li></ul></section>
    `
  }
}

renderDistricts()
renderEdges()
renderBuildings()
renderControls()
renderState()
