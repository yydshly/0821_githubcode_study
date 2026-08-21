const SOURCE_ROOT = "https://github.com/LoveRain1997/h3-prompt-journal/tree/0c7b4882dad8a302c304fe9be40f0b8b1b098b26/case-studies";

const cases = {
  "001": {
    title: "三人遮挡衔接环绕长镜头",
    duration: "20 秒",
    input: "3 张参考图",
    summary: "让三个人在同一空间里依次完成近距离环绕，并用人物身体形成前景遮挡，物理地揭示下一位主体。",
    problem: "“去往下一个人”被模型理解为切镜、瞬移、交叉淡化或身份变形。",
    breakthrough: "不描述飞向谁，而是描述镜头绕过肩膀、头发或背部，让下一个人从遮挡后自然出现。",
    control: "Occlusion-Linked Orbital Long Take",
    intent: "在同一物理空间完成三位人物的连续近距离环绕与最终合影。",
    roles: [
      ["Picture 1", "人物 1、主环境与统一空间坐标"],
      ["Picture 2", "只控制人物 2 外观"],
      ["Picture 3", "只控制人物 3 外观"]
    ],
    timeline: [
      ["0–6.5s", "人物 1 完整近距离环绕，身体靠近镜头形成遮挡"],
      ["6.5–13s", "绕过遮挡后揭示人物 2，继续完整环绕"],
      ["13–19s", "以同样物理机制揭示并环绕人物 3"],
      ["19–20s", "短距离后退，首次同时显示三人"]
    ],
    constraints: [
      ["identity", "三人身份独立", "禁止融合、变脸或互换服装", "Lock three distinct identities; never merge, morph, or exchange them."],
      ["environment", "单一环境主权", "只允许图 1 控制房间、光照与尺度", "Use Picture 1 as the sole environment and spatial coordinate source."],
      ["visibility", "单主体可见", "前三段一次只显示一人", "During each orbit, only the current subject may be visible."],
      ["occlusion", "遮挡式衔接", "肩膀、头发或背部必须经过前景", "Reveal the next subject by physically rounding a foreground body occlusion."],
      ["continuity", "连续物理镜头", "无切镜、瞬移、淡化或传送", "Maintain one motivated camera path with no cuts, teleportation, or crossfades."]
    ],
    audio: "Preserve natural room ambience; do not let audio imply a scene change.",
    evidence: "证据：README + Prompt，未附结果媒体",
    slug: "2026-08-three-person-orbital-long-take",
    compatibility: "注意：20 秒规格超出当前官方写作技能标注的 4–15 秒范围。"
  },
  "002": {
    title: "3:1 差速双人蝴蝶步",
    duration: "未注明",
    input: "1 图 / 2 人",
    summary: "让同一张图中的两位角色持续保持明显速度差：快者连续完成动作，慢者观察后再模仿。",
    problem: "“一个快、一个慢”只是形容词，模型会把两人重新吸附到同一个音乐节拍。",
    breakthrough: "把速度差改写为 3:1 动作数量，并给慢者增加“观看后模仿”的叙事动机。",
    control: "Asymmetric Speed-Ratio Duo Choreography",
    intent: "从第一秒到最后保持双人动作数量约 3:1，且慢者永不追平。",
    roles: [["Picture 1", "同时锁定左侧与右侧角色的身份和服装"]],
    timeline: [
      ["持续", "快者连续执行三个动作"],
      ["同时", "慢者只完成一个动作"],
      ["随后", "快者进入第四个动作，慢者才开始第二个"],
      ["全程", "慢者观察、延迟模仿，不突然加速"]
    ],
    constraints: [
      ["ratio", "3:1 数量锚点", "把速度差变成可数规则", "For every three actions by the fast subject, the slow subject completes one."],
      ["motivation", "观看后模仿", "用行为原因解释延迟", "The slow subject watches first, then imitates the action with a clear delay."],
      ["no-sync", "禁止重新同步", "不追赶、不突然加速", "Never synchronize, catch up, or suddenly accelerate the slow subject."],
      ["camera", "双人近距环绕", "腰部或膝盖以上，脸始终清楚", "Keep both faces clear in a close continuous orbit; avoid distant wide shots."],
      ["dance", "动作类型边界", "蝴蝶步、换重心，排除康康大踢腿", "Use light butterfly-step footwork and weight shifts; exclude high can-can kicks."]
    ],
    audio: "Instrumental BGM only; no vocals, dialogue, lyrics, humming, or character sounds.",
    evidence: "证据：README + 中文 Prompt，未附结果媒体",
    slug: "2026-08-dual-subject-speed-contrast"
  },
  "003": {
    title: "三姿态锚点微型相机飞行",
    duration: "15 秒",
    input: "3 图 / 同一人",
    summary: "让三个参考姿态成为连续运动中经过的路标，而不是抵达后停留的静态终点。",
    problem: "三张姿态图容易生成“姿态 1 → 淡化 → 姿态 2 → 淡化 → 姿态 3”的幻灯片。",
    breakthrough: "反转主动权：人物自然运动，极小的隐形相机高速预测、避让身体，并流经三个锚点。",
    control: "Micro-Cam Anchor-Flow Flight",
    intent: "用一个高速连续镜头穿过同一人物的三个姿态锚点，人物和相机都保持高动作密度。",
    roles: [
      ["Picture 1", "同一人物的起始姿态与外观"],
      ["Picture 2", "中间姿态锚点，不是停留终点"],
      ["Picture 3", "最终姿态锚点与英雄画面"]
    ],
    timeline: [
      ["0–2.5s", "从脚部开始高速低位飞行"],
      ["2.5–7.5s", "自然动作过渡到姿态 2，并快速上升环绕"],
      ["7.5–11.8s", "转向姿态 3，环绕上半身与头部"],
      ["11.8–15s", "快速接近面部、变向并极快拉回英雄画面"]
    ],
    constraints: [
      ["same-person", "同一人物锁", "三图是姿态，不是三个人", "Treat all three pictures as the same identity at different pose anchors."],
      ["anchors", "姿态是路标", "经过姿态，不到达后停住", "Flow through each pose as a waypoint; never land and hold like a slideshow."],
      ["microcam", "微型相机尺度", "用近距、视差和避让体现，不生成无人机", "Express a tiny invisible camera only through scale, proximity, parallax, and motion."],
      ["density", "双重动作密度", "人物和相机都持续变化", "Keep both the person and camera in frequent connected motion."],
      ["physics", "真实飞行路径", "有惯性、近身绕行，无传送", "Use motivated 3D flight with momentum and rapid body-part avoidance; no teleportation."]
    ],
    audio: "Use the requested music bed without allowing rhythm to freeze the pose transitions.",
    evidence: "证据：README + 879 行 Prompt，未附结果媒体",
    slug: "2026-08-single-subject-three-pose"
  },
  "004": {
    title: "多参考帆板时尚音乐 MV",
    duration: "3 × 15 秒",
    input: "2–3 图 / 分段",
    summary: "把人物、装备和摄影参考拆成不同职责，并在最终高潮段移除摄影图，让文字独占镜头控制。",
    problem: "多张参考图被等权处理，人物、装备图和构图图彼此妥协；复杂高潮又被指导图锁死。",
    breakthrough: "给每张图“岗位说明”，并在其任务结束时移除；用音乐功能切分时间而不是平均切段。",
    control: "Layered Reference Architecture with Text-Driven Climax",
    intent: "生成三段独立的竖屏帆板视频，组合为 45 秒能量递增的时尚运动 MV。",
    roles: [
      ["Picture 1", "身份、脸、发型、服装和第一帧"],
      ["Picture 2", "身体结构、服装结构与帆板装备；不是分镜"],
      ["Picture 3", "前两段的机位、镜头语言与构图；高潮段移除"]
    ],
    timeline: [
      ["Segment 1", "高速进入海面，建立人物与装备"],
      ["Segment 2", "进入大浪区，提升运动强度"],
      ["Segment 3", "只用图 1+2，文字控制腾空英雄镜头"],
      ["Post", "拼接完整视频 → 提取音频 → Suno 重制 → 最终同步"]
    ],
    constraints: [
      ["roles", "参考岗位说明", "同时写明每张图不控制什么", "Assign a single job to each reference and state what it must not control."],
      ["no-storyboard", "装备图不是分镜", "不复刻三视图版式", "Use Picture 2 for construction only; never reproduce its turnaround-sheet layout."],
      ["drop-guide", "高潮移除摄影图", "最终段由文字独占镜头控制", "For the climax segment, omit Picture 3 and let the timeline direct the camera."],
      ["music", "音乐功能时间线", "重音决定动作，释放决定镜头缓和", "Make musical accents trigger action peaks and releases ease the camera."],
      ["physics", "帆板物理连接", "手、横杆、板、帆索保持可信", "Preserve believable windsurfing mechanics and physical equipment connections."]
    ],
    audio: "Generate the three visuals first; remix the complete extracted audio as one musical arc, then resync.",
    evidence: "证据：README + 1465 行制作文档 + 4 图 + 1 个约 36 秒附件",
    slug: "2026-08-furina-windsurfing-fashion-mv"
  },
  "005": {
    title: "剧情锚点式水上闯关综艺",
    duration: "20 秒",
    input: "1 张参考图",
    summary: "锁定七个不可改变的剧情节点，把具体躲避、摔倒、机位、剪辑和观众反应交给模型发挥。",
    problem: "逐动作规定会让综艺表演僵硬；只写“有趣”又会让剧情失去方向。",
    breakthrough: "把提示词变成故事骨架：固定事件顺序，同时列出允许模型自由决定的执行维度。",
    control: "Beat-Anchored Improvisation",
    intent: "生成有明确起承转合、但动作和反应仍自然的电视水上闯关喜剧段落。",
    roles: [["Picture 1", "只控制主角身份与外观；场地、障碍和摄影由模型生成"]],
    timeline: [
      ["开场", "问候并进入滚筒"],
      ["推进", "通过滚筒，在 Fishbone 意外摔倒后立即恢复"],
      ["假胜利", "攀上高墙并抓住边缘"],
      ["反转", "侧面机关击飞 → 落水 → 湿发委屈式收尾"]
    ],
    constraints: [
      ["identity", "单图身份范围", "不新增参考图中没有的穿戴物", "Use Picture 1 for identity only; do not add new wearable accessories."],
      ["beats", "七个剧情锚点", "固定发生顺序，不固定细节", "Preserve the required story beats and their order without scripting every move."],
      ["freedom", "显式自由授权", "动作、机位、节奏、反应允许自行决定", "Grant freedom over choreography, camera, edit rhythm, acting, and audience reactions."],
      ["space", "连续场地", "障碍、跑道和水池关系清楚", "Keep one coherent linear course and preserve spatial relationships across shots."],
      ["dialogue", "对白情绪锚点", "开场建立性格，结尾完成笑点", "Use a brief opening line and closing punchline to anchor the emotional arc."]
    ],
    audio: "Use live Mandarin commentary, audience reactions, obstacle sounds, splash, and playful sports-variety music.",
    evidence: "证据：README + 六段式 Prompt，未附结果媒体",
    slug: "2026-08-water-obstacle-variety-show",
    compatibility: "注意：20 秒规格超出当前官方写作技能标注的 4–15 秒范围。"
  },
  "006": {
    title: "2D 贴纸 × 真实厨房混合媒介喜剧",
    duration: "10 秒",
    input: "1 张贴纸图",
    summary: "让扁平贴纸角色保持 2D 身份进入真人厨房，并用精确时间锚点完成加盐、报复和昏倒三段笑点。",
    problem: "模型会把贴纸“帮助性地”渲染成 3D，还会按玻璃罐先验自动生成盖子，导致动作无法成立。",
    breakthrough: "把平面媒介写进角色身份；用覆盖所有逃逸路径的否定清单彻底排除罐盖。",
    control: "Mixed-Media Sticker-in-Reality Comedy",
    intent: "在真实厨房中保留 2D 贴纸的媒介差异，并按毫秒节拍完成无对白视觉喜剧。",
    roles: [["Picture 1", "贴纸角色身份、比例、颜色、轮廓与平面媒介属性"]],
    timeline: [
      ["0–3s", "贴纸亲自从永久敞口盐罐向炒锅倒盐"],
      ["03.000", "真人手夺走盐罐并用锅铲轻敲贴纸"],
      ["05.000", "贴纸被喂下过咸食物，出现夸张反应"],
      ["08–10s", "X 眼、后仰跌落、旋转星星与灵魂效果，镜头停住"]
    ],
    constraints: [
      ["medium", "媒介即身份", "平面不是风格备注，而是角色定义", "Preserve the exact flat 2D sticker appearance as an identity property in every shot."],
      ["prop", "封闭式道具否定", "无盖、无帽、无可拆覆盖物，场景也无盖", "The salt jar has no lid, cap, or removable cover; no lid exists anywhere in the scene."],
      ["labor", "混合媒介分工", "真人手炒菜互动，贴纸负责闯祸和反应", "Real hands cook and react; the sticker alone handles the salt jar and comic performance."],
      ["anchors", "毫秒笑点", "03 / 05 / 08 秒锁定动作转折", "Anchor the three comic turns precisely at 00:03.000, 00:05.000, and 00:08.000."],
      ["silence", "无对白调性", "只保留厨房环境声", "Use kitchen ambience only; no dialogue, narration, singing, or music."]
    ],
    audio: "Natural kitchen ambience and cooking sounds only; no non-diegetic music.",
    evidence: "证据：README + 六段式 Prompt + 1 张输入图，未附成片",
    slug: "2026-08-sticker-character-kitchen-comedy"
  }
};

const elements = {
  caseButtons: [...document.querySelectorAll(".case-button")],
  number: document.querySelector("#case-number"),
  duration: document.querySelector("#case-duration"),
  input: document.querySelector("#case-input"),
  title: document.querySelector("#case-title"),
  summary: document.querySelector("#case-summary"),
  problem: document.querySelector("#case-problem"),
  breakthrough: document.querySelector("#case-breakthrough"),
  roles: document.querySelector("#reference-roles"),
  timeline: document.querySelector("#timeline"),
  constraints: document.querySelector("#constraint-list"),
  prompt: document.querySelector("#prompt-output"),
  copy: document.querySelector("#copy-prompt"),
  copyStatus: document.querySelector("#copy-status"),
  source: document.querySelector("#case-source"),
  evidence: document.querySelector("#case-evidence"),
  theme: document.querySelector("#theme-toggle"),
  themeLabel: document.querySelector(".theme-label")
};

let activeCase = "001";
const selections = new Map();

function selectedConstraintIds(caseId) {
  if (!selections.has(caseId)) {
    selections.set(caseId, new Set(cases[caseId].constraints.map(([id]) => id)));
  }
  return selections.get(caseId);
}

function makeElement(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderRoles(item) {
  const fragment = document.createDocumentFragment();
  item.roles.forEach(([name, detail]) => {
    const row = makeElement("div", "role-item");
    row.append(makeElement("strong", "", name), makeElement("span", "", detail));
    fragment.append(row);
  });
  elements.roles.replaceChildren(fragment);
}

function renderTimeline(item) {
  const fragment = document.createDocumentFragment();
  item.timeline.forEach(([time, detail]) => {
    const row = document.createElement("li");
    row.append(makeElement("time", "", time), makeElement("span", "", detail));
    fragment.append(row);
  });
  elements.timeline.replaceChildren(fragment);
}

function renderConstraints(item) {
  const enabled = selectedConstraintIds(activeCase);
  const fragment = document.createDocumentFragment();

  item.constraints.forEach(([id, label, hint]) => {
    const wrapper = makeElement("label", "constraint-option");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = enabled.has(id);
    checkbox.dataset.constraint = id;
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) enabled.add(id);
      else enabled.delete(id);
      renderPrompt();
    });

    const text = document.createElement("span");
    text.append(makeElement("strong", "", label), makeElement("small", "", hint));
    wrapper.append(checkbox, text);
    fragment.append(wrapper);
  });

  elements.constraints.replaceChildren(fragment);
}

function buildPrompt(item) {
  const enabled = selectedConstraintIds(activeCase);
  const roleLines = item.roles.map(([name, detail]) => `- ${name}: ${detail}`).join("\n");
  const timelineLines = item.timeline.map(([time, detail]) => `- ${time}: ${detail}`).join("\n");
  const constraintLines = item.constraints
    .filter(([id]) => enabled.has(id))
    .map(([, label, , line]) => `- [${label}] ${line}`)
    .join("\n");

  return `[研究演示骨架 · 非上游原文]

MODE / FORMAT
- 目标时长：${item.duration}
- 输入：${item.input}
- 核心策略：${item.control}

CREATIVE INTENT
${item.intent}

REFERENCE ROLES
${roleLines}

TIMELINE / STORY BEATS
${timelineLines}

ACTIVE CONSTRAINTS
${constraintLines || "- 当前未启用约束；这通常会失去案例的核心控制能力。"}

AUDIO
${item.audio}

VALIDATION NOTE
- 在当前 H3 版本上先做低成本测试，记录模型版本、参数、失败样本与重复结果。
${item.compatibility ? `- ${item.compatibility}\n` : ""}- 生产使用前请阅读对应上游完整 Prompt。`;
}

function renderPrompt() {
  elements.prompt.textContent = buildPrompt(cases[activeCase]);
  elements.copyStatus.textContent = "";
}

function renderCase(caseId, shouldFocus = false) {
  activeCase = caseId;
  const item = cases[caseId];

  elements.caseButtons.forEach((button) => {
    const active = button.dataset.case === caseId;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
    if (active && shouldFocus) button.focus();
  });

  elements.number.textContent = `CASE ${caseId}`;
  elements.duration.textContent = item.duration;
  elements.input.textContent = item.input;
  elements.title.textContent = item.title;
  elements.summary.textContent = item.summary;
  elements.problem.textContent = item.problem;
  elements.breakthrough.textContent = item.breakthrough;
  elements.source.href = `${SOURCE_ROOT}/${item.slug}`;
  elements.evidence.textContent = item.evidence;

  renderRoles(item);
  renderTimeline(item);
  renderConstraints(item);
  renderPrompt();
}

elements.caseButtons.forEach((button, index) => {
  button.addEventListener("click", () => renderCase(button.dataset.case));
  button.addEventListener("keydown", (event) => {
    if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = (index + 1) % elements.caseButtons.length;
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") nextIndex = (index - 1 + elements.caseButtons.length) % elements.caseButtons.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = elements.caseButtons.length - 1;
    renderCase(elements.caseButtons[nextIndex].dataset.case, true);
  });
});

async function copyPrompt() {
  const value = elements.prompt.textContent;
  try {
    await navigator.clipboard.writeText(value);
    elements.copyStatus.textContent = "已复制提示词骨架。";
  } catch {
    const fallback = document.createElement("textarea");
    fallback.value = value;
    fallback.setAttribute("readonly", "");
    fallback.style.position = "fixed";
    fallback.style.opacity = "0";
    document.body.append(fallback);
    fallback.select();
    const copied = document.execCommand("copy");
    fallback.remove();
    elements.copyStatus.textContent = copied ? "已复制提示词骨架。" : "复制失败，请在预览区手动选择文本。";
  }
}

elements.copy.addEventListener("click", copyPrompt);

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === "dark";
  elements.theme.setAttribute("aria-pressed", String(dark));
  elements.theme.setAttribute("aria-label", dark ? "切换浅色主题" : "切换深色主题");
  elements.themeLabel.textContent = dark ? "浅色" : "深色";
}

let storedTheme = null;
try {
  storedTheme = localStorage.getItem("h3-research-theme");
} catch {
  storedTheme = null;
}

applyTheme(storedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

elements.theme.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  try {
    localStorage.setItem("h3-research-theme", next);
  } catch {
    // Theme still works for the current session when storage is unavailable.
  }
});

renderCase(activeCase);
