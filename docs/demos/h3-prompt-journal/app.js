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

const designerPresets = {
  "001": {
    common: { subject: "Three distinct adult performers: SUBJECT_A in a black tailored suit, SUBJECT_B in a cobalt jacket, and SUBJECT_C in a cream dress. Preserve each face, hairstyle, clothing, and body proportion independently.", scene: "One coherent modern gallery with warm practical lighting, polished concrete, and a single stable spatial coordinate system.", action: "Complete one continuous close orbital pass around all three performers, using physical foreground occlusion to reveal each next subject, then finish on a brief group composition.", style: "cinematic fashion film, natural skin texture, controlled handheld energy", duration: 15, aspect: "16:9", soundscape: "Natural room tone, subtle footsteps, fabric movement, and camera proximity; no sound may imply a location change.", music: "Minimal low-tempo instrumental pulse, mixed below the room ambience; no vocals." },
    roles: ["Identity, appearance, environment, lighting, and the sole spatial coordinate source for SUBJECT_A.", "Identity and appearance of SUBJECT_B only; it must not control environment or framing.", "Identity and appearance of SUBJECT_C only; it must not control environment or framing."],
    fields: [
      { id: "names", label: "主体标签", value: "SUBJECT_A, SUBJECT_B, SUBJECT_C" },
      { id: "occluders", label: "遮挡表面", value: "shoulder, hair, and back crossing close foreground" },
      { id: "ending", label: "最终构图", value: "a brief three-person medium-wide portrait after a short physical pullback" }
    ]
  },
  "002": {
    common: { subject: "Two adult dancers in Picture 1: FAST_SUBJECT on the left and SLOW_SUBJECT on the right. Preserve both identities, outfits, faces, and left-right relationship.", scene: "A clean rehearsal studio with a reflective floor and soft directional daylight.", action: "Maintain an unmistakable action-count speed contrast while both dancers perform light butterfly-step footwork in the same continuous shot.", style: "polished dance rehearsal film, crisp full-body motion, natural timing", duration: 12, aspect: "16:9", soundscape: "Light shoe impacts, cloth movement, and quiet studio ambience; no dialogue or character vocalizations.", music: "Instrumental rhythmic track only, with no lyrics, singing, or humming." },
    roles: ["Identity, clothing, proportions, and initial left-right placement of FAST_SUBJECT and SLOW_SUBJECT."],
    fields: [
      { id: "fast", label: "快者标签", value: "FAST_SUBJECT" },
      { id: "slow", label: "慢者标签", value: "SLOW_SUBJECT" },
      { id: "ratio", label: "动作数量比例", type: "number", min: 2, max: 6, value: 3 }
    ]
  },
  "003": {
    common: { subject: "One adult performer shown across three pictures. All pictures represent the same identity, clothing, hairstyle, and body proportions at different pose anchors.", scene: "A monumental minimal interior with strong parallax layers, textured stone, and shafts of cool light.", action: "Fly a tiny invisible camera through three pose waypoints while the performer moves continuously; never stop on an anchor like a slideshow.", style: "high-energy miniature-camera fashion flight, wide-angle parallax, cinematic realism", duration: 15, aspect: "9:16", soundscape: "Fast spatial air movement, close fabric passes, footsteps, and a coherent interior reverb.", music: "Driving instrumental electronic score whose accents increase motion without freezing poses." },
    roles: ["Same identity, exact appearance, and starting pose anchor.", "Intermediate pose waypoint for the same identity; never a static destination.", "Final pose waypoint and hero composition for the same identity."],
    fields: [
      { id: "anchors", label: "姿态路径", type: "textarea", value: "low foot-level entry → torso-side rising orbit → face-level hero pullback" },
      { id: "intensity", label: "相机强度", type: "select", options: [["controlled", "受控快速"], ["extreme", "极高速"], ["smooth", "流畅中速"]], value: "controlled" },
      { id: "proximity", label: "最近距离", value: "pass within centimeters of shoes, hands, fabric, and hair without collision" }
    ]
  },
  "004": {
    common: { subject: "A single athletic fashion performer whose face, hairstyle, body proportions, and outfit are defined by Picture 1; windsurfing equipment construction is defined by Picture 2.", scene: "Open ocean at golden hour with large readable waves, wind-driven spray, and a clean horizon.", action: "Create one self-contained vertical segment of a rising-energy windsurfing fashion film with credible board, sail, boom, hand, and body mechanics.", style: "luxury sports-fashion music video, kinetic spray, heroic natural light", duration: 15, aspect: "9:16", soundscape: "Wind pressure, sail tension, board impacts, water spray, and wave movement with strong spatial realism.", music: "Instrumental fashion-electronic score; align action peaks to accents and relax the camera on musical releases." },
    roles: ["Identity, face, hair, outfit, and opening appearance; not camera choreography.", "Body and equipment construction only; never reproduce a turnaround-sheet layout.", "Camera language and composition guide for entry/build segments only; omit it in the climax segment."],
    fields: [
      { id: "segment", label: "本次分段", type: "select", options: [["entry", "入场段"], ["build", "推进段"], ["climax", "高潮段（移除 Picture 3）"]], value: "entry" },
      { id: "peak", label: "峰值时刻（秒）", type: "number", min: 4, max: 14, value: 10 },
      { id: "energy", label: "能量弧线", value: "fast entry → controlled carve → spray-driven peak → confident release" }
    ]
  },
  "005": {
    common: { subject: "One charismatic adult contestant whose identity, face, hair, clothing, and body proportions are defined by Picture 1.", scene: "A coherent outdoor television water-obstacle course with a start platform, rotating rollers, a fishbone obstacle, a high wall, and a visible pool.", action: "Deliver a compact sports-variety comedy arc with mandatory story beats in order while allowing natural improvised movement, camera choices, and reactions.", style: "bright live television variety show, playful physical comedy, readable action", duration: 15, aspect: "16:9", soundscape: "Live Mandarin commentary, audience reactions, obstacle mechanisms, footsteps, impacts, and a final water splash.", music: "Light playful sports-variety instrumental bed, ducked beneath dialogue and physical action." },
    roles: ["Contestant identity and appearance only; the course, obstacles, camera, and performance execution remain text-driven."],
    fields: [
      { id: "beats", label: "必须剧情节点", type: "textarea", value: "greeting → roller crossing → recoverable fishbone fall → high-wall near victory → side mechanism reversal → splash → wet-haired reaction" },
      { id: "freedom", label: "明确放权范围", type: "textarea", value: "exact choreography, camera placement, edit rhythm, facial acting, audience timing, and recovery details" },
      { id: "punchline", label: "结尾笑点", value: "a brief disappointed look to camera after resurfacing, with wet hair and comic dignity" }
    ]
  },
  "006": {
    common: { subject: "A small flat 2D sticker character from Picture 1. Preserve its exact outline, colors, printed shading, proportions, and visibly planar material as immutable identity properties.", scene: "A photoreal live-action home kitchen with a frying pan, cooking utensils, a permanently open salt jar, and real human hands.", action: "Stage a silent mixed-media comedy in which the sticker oversalts the pan, receives playful retaliation, tastes the result, and collapses on precise comic timing.", style: "photoreal kitchen plate with crisp flat 2D sticker compositing and tactile practical light", duration: 10, aspect: "16:9", soundscape: "Natural kitchen room tone, frying, utensil taps, salt movement, and small impacts only; no speech or vocalization.", music: "No non-diegetic music." },
    roles: ["Sticker identity, exact proportions, colors, outline, and permanently flat 2D medium; it must never become a 3D figure."],
    fields: [
      { id: "medium", label: "媒介锁定", value: "flat printed 2D sticker with no thickness, volume, realistic skin, or 3D reinterpretation" },
      { id: "forbidden", label: "禁止道具先验", type: "textarea", value: "The salt jar has no lid, cap, cork, cover, hinge, or removable top; no such object exists anywhere in the scene." },
      { id: "anchors", label: "笑点时间锚", value: "00:03.000 retaliation; 00:05.000 tasting reaction; 00:08.000 collapse" }
    ]
  }
};

const elements = {
  caseButtons: [...document.querySelectorAll(".case-button")], number: document.querySelector("#case-number"),
  durationMeta: document.querySelector("#case-duration"), inputMeta: document.querySelector("#case-input"),
  title: document.querySelector("#case-title"), summary: document.querySelector("#case-summary"),
  problem: document.querySelector("#case-problem"), breakthrough: document.querySelector("#case-breakthrough"),
  roles: document.querySelector("#reference-roles"), roleEditor: document.querySelector("#role-editor"),
  timeline: document.querySelector("#timeline"), strategyFields: document.querySelector("#strategy-fields"),
  constraints: document.querySelector("#constraint-list"), form: document.querySelector("#prompt-form"),
  prompt: document.querySelector("#prompt-output"), stats: document.querySelector("#prompt-stats"),
  copy: document.querySelector("#copy-prompt"), download: document.querySelector("#download-prompt"),
  reset: document.querySelector("#reset-prompt"), copyStatus: document.querySelector("#copy-status"),
  validation: document.querySelector("#validation-panel"), validationTitle: document.querySelector("#validation-title"),
  validationMessage: document.querySelector("#validation-message"), source: document.querySelector("#case-source"),
  evidence: document.querySelector("#case-evidence"), theme: document.querySelector("#theme-toggle"),
  themeLabel: document.querySelector(".theme-label")
};

const fieldIds = ["subject", "scene", "action", "style", "duration", "aspect", "soundscape", "music"];
const states = new Map();
let activeCase = "001";

function clonePreset(caseId) {
  const preset = designerPresets[caseId];
  return { common: { ...preset.common }, roles: [...preset.roles], fields: Object.fromEntries(preset.fields.map((field) => [field.id, field.value])), constraints: new Set(cases[caseId].constraints.map(([id]) => id)) };
}

function stateFor(caseId) {
  if (!states.has(caseId)) states.set(caseId, clonePreset(caseId));
  return states.get(caseId);
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

function renderRoleEditor() {
  const state = stateFor(activeCase);
  const fragment = document.createDocumentFragment();
  state.roles.forEach((value, index) => {
    const label = makeElement("label", "field role-field");
    const title = makeElement("span", "", `Picture ${index + 1} 职责`);
    const input = document.createElement("textarea");
    input.rows = 3;
    input.value = value;
    input.dataset.roleIndex = String(index);
    input.required = true;
    label.append(title, input);
    fragment.append(label);
  });
  elements.roleEditor.replaceChildren(fragment);
}

function createStrategyControl(field, value) {
  const label = makeElement("label", `field${field.type === "textarea" ? " field-wide" : ""}`);
  label.append(makeElement("span", "", field.label));
  let control;
  if (field.type === "textarea") {
    control = document.createElement("textarea");
    control.rows = 3;
  } else if (field.type === "select") {
    control = document.createElement("select");
    field.options.forEach(([optionValue, optionLabel]) => {
      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = optionLabel;
      control.append(option);
    });
  } else {
    control = document.createElement("input");
    control.type = field.type || "text";
    if (field.min !== undefined) control.min = String(field.min);
    if (field.max !== undefined) control.max = String(field.max);
  }
  control.value = value;
  control.dataset.strategyField = field.id;
  control.required = true;
  label.append(control);
  return label;
}

function renderStrategyFields() {
  const preset = designerPresets[activeCase];
  const state = stateFor(activeCase);
  elements.strategyFields.replaceChildren(...preset.fields.map((field) => createStrategyControl(field, state.fields[field.id])));
}

function renderConstraints(item) {
  const state = stateFor(activeCase);
  const fragment = document.createDocumentFragment();
  item.constraints.forEach(([id, label, hint]) => {
    const wrapper = makeElement("label", "constraint-option");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = state.constraints.has(id);
    checkbox.dataset.constraint = id;
    const text = document.createElement("span");
    text.append(makeElement("strong", "", label), makeElement("small", "", hint));
    wrapper.append(checkbox, text);
    fragment.append(wrapper);
  });
  elements.constraints.replaceChildren(fragment);
}

function formatTime(seconds) {
  const safe = Math.max(0, Number(seconds));
  const minutes = String(Math.floor(safe / 60)).padStart(2, "0");
  const remainder = (safe % 60).toFixed(3).padStart(6, "0");
  return `${minutes}:${remainder}`;
}

function activeRoles(state) {
  if (activeCase === "004" && state.fields.segment === "climax") return state.roles.slice(0, 2);
  return state.roles;
}

function strategyDirection(state) {
  const f = state.fields;
  const directions = {
    "001": `Keep ${f.names} separate at all times. Use ${f.occluders} as motivated foreground transitions. End with ${f.ending}.`,
    "002": `${f.fast} completes ${f.ratio} distinct actions for every one completed by ${f.slow}. ${f.slow} watches before imitating and never catches up or resynchronizes.`,
    "003": `Pose route: ${f.anchors}. Camera intensity: ${f.intensity}. Closest-path rule: ${f.proximity}.`,
    "004": `This is the ${f.segment} segment. Energy arc: ${f.energy}. Place the main action peak at ${formatTime(f.peak)}.${f.segment === "climax" ? " Picture 3 is intentionally omitted so text has exclusive camera control." : " Picture 3 may guide camera language but not identity or equipment."}`,
    "005": `Mandatory ordered beats: ${f.beats}. Explicitly grant freedom over ${f.freedom}. Closing punchline: ${f.punchline}.`,
    "006": `Medium lock: ${f.medium}. Closed-world prop rule: ${f.forbidden}. Comic anchors: ${f.anchors}.`
  };
  return directions[activeCase];
}

function shotPlan(state) {
  const duration = Number(state.common.duration);
  const t1 = formatTime(duration * 0.28);
  const t2 = formatTime(duration * 0.62);
  const t3 = formatTime(duration * 0.84);
  const plans = {
    "001": ["Begin close on SUBJECT_A and establish the single gallery coordinate system while the camera starts a complete, physically motivated orbit.", "Let SUBJECT_A fill the foreground with shoulder, hair, or back. Without cutting, round that real occlusion to discover SUBJECT_B already standing in the same space, then repeat the orbital logic.", "Use SUBJECT_B as the next physical occluder and reveal SUBJECT_C with unchanged room geometry, light direction, scale, and identity separation.", "Pull back only after all three orbits are complete and hold the requested group composition briefly; do not introduce a cut, dissolve, teleport, morph, or costume exchange."],
    "002": ["Establish both dancers from knees or waist upward with both faces readable, then immediately begin the asymmetric choreography.", "FAST_SUBJECT performs three clean butterfly-step actions while SLOW_SUBJECT watches and completes only one deliberate response; preserve the count rather than merely suggesting different moods.", "Continue the same count logic as FAST_SUBJECT begins the next cycle and SLOW_SUBJECT starts a delayed imitation. Keep the close orbital camera smooth and retain the initial left-right identity relation.", "Finish without a synchronized pose. SLOW_SUBJECT remains visibly behind in action count and never accelerates to catch the musical beat."],
    "003": ["Start at foot level with extreme proximity and immediate forward motion. The performer begins moving naturally from the first pose while the invisible camera demonstrates tiny scale through parallax, not by showing a drone.", "Rise and curve around the body toward the second pose waypoint. Pass close to shoes, hands, fabric, and torso with credible momentum and avoidance; the pose is crossed through, never reached and held.", "Redirect around the upper body and hair toward Picture 3. Preserve one identity and continuous anatomy while both performer and camera maintain connected motion density.", "Approach the face rapidly, change direction without teleporting, then pull back into the final hero composition. Do not fade, freeze, or present the three pictures as slideshow panels."],
    "004": ["Open with the performer and complete windsurfing rig already connected by credible hands, boom, sail, board, and stance. Establish direction, wave scale, wind pressure, and fashion identity immediately.", "Build speed through a readable carve. Picture 2 controls construction only and must never appear as a turnaround sheet, collage, or storyboard. Water spray and sail tension respond to the same physical action.", "Drive toward the selected musical and motion peak. Camera energy and body mechanics rise together while identity, outfit, equipment, horizon, and contact points remain stable.", "Release from the peak into a confident closing beat suitable for editing with adjacent segments. Preserve vertical composition and avoid unrelated scene changes or decorative equipment mutation."],
    "005": ["Open as live television: the contestant greets the audience and commits to the first obstacle. Establish the linear course so later setbacks remain spatially understandable.", "Move through the required early beats in order, including a recoverable comic fall. Let the model choose natural footwork, camera placement, reaction timing, and audience response without skipping any anchor.", "Create a convincing near-victory at the high wall, then trigger the side mechanism reversal. Maintain the same contestant, wardrobe, course geometry, and direction of travel across any motivated television edits.", "Land the splash, resurfacing, and final look-to-camera punchline. Keep physical comedy playful rather than harmful, and allow the wet-haired reaction enough screen time to read."],
    "006": ["Establish a photoreal kitchen and the visibly flat sticker beside a permanently open salt jar. The sticker itself handles the jar and pours salt into the pan while real hands continue cooking.", "At the first anchor, a real hand removes the jar and gives a light comic utensil tap. The sticker stays perfectly planar, printed, and unchanged; no lid or related cover appears before, during, or after the action.", "At the second anchor, the sticker tastes the oversalted food and performs an exaggerated flat-animation reaction while remaining integrated into the real lighting and contact plane.", "At the final anchor, show X eyes, a backward fall, rotating stars, and a small soul effect, then hold. Preserve the mixed-media contrast and use no dialogue, narration, singing, or music." ]
  };
  return plans[activeCase].map((text, index) => `${index === 0 ? "[Shot 1]" : `[Shot ${index + 1}] At ${[t1, t2, t3][index - 1]},`} ${text}`).join("\n\n");
}

function buildPrompt() {
  const item = cases[activeCase];
  const state = stateFor(activeCase);
  const roles = activeRoles(state);
  const roleDefinitions = roles.map((role, index) => `Picture ${index + 1}: ${role}`).join("\n");
  const retention = roles.map((role, index) => `Picture ${index + 1}: fully_preserved — ${role}`).join("\n");
  const constraints = item.constraints.filter(([id]) => state.constraints.has(id)).map(([, , , line]) => `- ${line}`).join("\n");
  const dropNote = activeCase === "004" && state.fields.segment === "climax" ? "\nPicture 3: weak_reference — intentionally not supplied for this climax prompt." : "";
  return `subject_definitions:
PRIMARY_SUBJECT: ${state.common.subject}
REFERENCE_ROLES:
${roleDefinitions}

summary:
[reference generation] Create a ${state.common.duration}-second ${state.common.aspect} video using the ${item.control} strategy. Scene: ${state.common.scene} Visual treatment: ${state.common.style}. Goal: ${state.common.action}

retention_analysis:
${retention}${dropNote}
The named subject labels, identity boundaries, role assignments, and medium properties must remain consistent in every section and shot.

detailed_description:
Global direction: ${strategyDirection(state)}

${shotPlan(state)}

Continuity and control rules:
${constraints || "- No strategy constraint is active; enable at least one control rule before production use."}

The complete video must stay inside one ${state.common.duration}-second generation. Preserve causal motion, readable subject identity, coherent spatial relationships, and the requested ${state.common.aspect} composition. Do not infer extra reference roles, props, identities, scene changes, or transitions that conflict with the definitions above.

overall_soundscape:
${state.common.soundscape}

non_diegetic_music:
${state.common.music}`;
}

function validate() {
  const state = stateFor(activeCase);
  const issues = [];
  const required = ["subject", "scene", "action", "style", "soundscape", "music"];
  required.forEach((id) => {
    const control = document.querySelector(`#${id}`);
    const invalid = !String(state.common[id] ?? "").trim();
    control.setAttribute("aria-invalid", String(invalid));
    if (invalid) issues.push(`${control.previousElementSibling?.textContent.replace("必填", "").trim() || id}不能为空`);
  });
  const duration = Number(state.common.duration);
  const durationControl = document.querySelector("#duration");
  const durationInvalid = !Number.isFinite(duration) || duration < 4 || duration > 15;
  durationControl.setAttribute("aria-invalid", String(durationInvalid));
  if (durationInvalid) issues.push("时长必须是 4–15 秒");
  if (activeRoles(state).some((role) => !role.trim())) issues.push("每张使用中的参考图都需要明确职责");
  if (state.constraints.size === 0) issues.push("至少保留一项策略约束");

  const ready = issues.length === 0;
  elements.validation.classList.toggle("is-ready", ready);
  elements.validation.classList.toggle("has-error", !ready);
  elements.validationTitle.textContent = ready ? "可复制到 H3" : `还需处理 ${issues.length} 项`;
  elements.validationMessage.textContent = ready ? `CASE ${activeCase} 已通过结构检查：六段顺序完整、时长有效、参考职责明确。` : issues.join("；");
  elements.copy.disabled = !ready;
  elements.download.disabled = !ready;
  return ready;
}

function renderPrompt() {
  const prompt = buildPrompt();
  elements.prompt.textContent = prompt;
  elements.stats.textContent = `${prompt.length.toLocaleString("zh-CN")} 字符 · 6 段`;
  elements.copyStatus.textContent = "";
  validate();
}

function populateCommonFields() {
  const common = stateFor(activeCase).common;
  fieldIds.forEach((id) => { document.querySelector(`#${id}`).value = common[id]; });
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
  elements.durationMeta.textContent = item.duration;
  elements.inputMeta.textContent = item.input;
  elements.title.textContent = item.title;
  elements.summary.textContent = item.summary;
  elements.problem.textContent = item.problem;
  elements.breakthrough.textContent = item.breakthrough;
  elements.source.href = `${SOURCE_ROOT}/${item.slug}`;
  elements.evidence.textContent = item.evidence;
  renderRoles(item);
  renderTimeline(item);
  populateCommonFields();
  renderRoleEditor();
  renderStrategyFields();
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

function updateFormState(event) {
  const state = stateFor(activeCase);
  const target = event.target;
  if (fieldIds.includes(target.id)) state.common[target.id] = target.type === "number" ? Number(target.value) : target.value;
  if (target.dataset.roleIndex !== undefined) state.roles[Number(target.dataset.roleIndex)] = target.value;
  if (target.dataset.strategyField) state.fields[target.dataset.strategyField] = target.type === "number" ? Number(target.value) : target.value;
  renderPrompt();
}

elements.form.addEventListener("input", updateFormState);
elements.form.addEventListener("change", updateFormState);

elements.constraints.addEventListener("change", (event) => {
  const target = event.target;
  if (!target.dataset.constraint) return;
  const state = stateFor(activeCase);
  if (target.checked) state.constraints.add(target.dataset.constraint);
  else state.constraints.delete(target.dataset.constraint);
  renderPrompt();
});

async function copyPrompt() {
  if (!validate()) return;
  const value = elements.prompt.textContent;
  try {
    await navigator.clipboard.writeText(value);
    elements.copyStatus.textContent = "已复制完整 Prompt，可前往 H3 粘贴并上传对应参考图。";
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
    elements.copyStatus.textContent = copied ? "已复制完整 Prompt。" : "复制失败，请在预览区手动选择文本。";
  }
}

function downloadPrompt() {
  if (!validate()) return;
  const blob = new Blob([elements.prompt.textContent], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = `h3-prompt-case-${activeCase}.txt`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  elements.copyStatus.textContent = `已下载 h3-prompt-case-${activeCase}.txt。`;
}

elements.copy.addEventListener("click", copyPrompt);
elements.download.addEventListener("click", downloadPrompt);
elements.reset.addEventListener("click", () => {
  states.set(activeCase, clonePreset(activeCase));
  renderCase(activeCase);
  elements.copyStatus.textContent = "已恢复当前策略的示例模板。";
});

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === "dark";
  elements.theme.setAttribute("aria-pressed", String(dark));
  elements.theme.setAttribute("aria-label", dark ? "切换浅色主题" : "切换深色主题");
  elements.themeLabel.textContent = dark ? "浅色" : "深色";
}

let storedTheme = null;
try { storedTheme = localStorage.getItem("h3-research-theme"); } catch { storedTheme = null; }
applyTheme(storedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
elements.theme.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  try { localStorage.setItem("h3-research-theme", next); } catch { /* Session theme still works. */ }
});

renderCase(activeCase);
