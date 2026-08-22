import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import createWatchtower from '../upstream/lib/models/watchtower.js';
import createSentry from '../upstream/lib/models/sentry.js';
import createDish from '../upstream/lib/models/dish.js';
import createBridge from '../upstream/lib/models/bridge.js';
import { FAMILY_CATALOG, catalogSummary, createFamilyObject } from './object-families.mjs';

const $ = (selector) => document.querySelector(selector);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const forceFallback = new URLSearchParams(location.search).has('fallback');
const originalView = $('#original-view');
const spatialView = $('#spatial-view');
const fallbackView = $('#fallback-view');
const technicalPanel = $('#technical-panel');
const storyPanel = $('#story-panel');
const familyPanel = $('#family-panel');
const sceneKicker = $('#scene-kicker');
const sceneTitle = $('#scene-title');
const sceneSummary = $('#scene-summary');
const sceneState = $('#scene-state');
const topStatusText = $('#top-status-text');

const techSteps = [
  {
    time: 0.15, part: 'shaft', kicker: 'PHYSICAL PROVENANCE', title: '地面先交出空间',
    description: '机器不会凭空出现。竖井边缘先从地表显露，建立后续运动的物理来源。',
    channel: 'position.y · -0.15 → 0.00',
    extension: '地形 socket / 建造占位 / 地表材质适配',
    camera: [6.2, 3.1, 7.2], target: [0, 0.25, 0],
  },
  {
    time: 0.82, part: 'slab', kicker: 'TERRAIN HAND-OFF', title: '盖板打开地下通道',
    description: 'soil 材质盖板下沉到地下。真正的遮挡来自宿主的不透明地面，而不是黑色洞口贴片。',
    channel: 'position.y · -0.10 → -1.78',
    extension: '地形切洞 / NavMesh 阻挡 / 碰撞体切换',
    camera: [5.4, 2.5, 6.0], target: [0, -0.3, 0],
  },
  {
    time: 1.36, part: 'base-0', kicker: 'RADIAL ASSEMBLY', title: '底座分片升起并展开',
    description: '三段圆环先从地下升起，再沿水平面扩张。多零件错峰让组装显得由多个机构共同完成。',
    channel: 'position.y + scale.x/z',
    extension: '零件模板 / 阵营外观 / 模块插槽',
    camera: [5.8, 3.3, 6.5], target: [0, 0.4, 0],
  },
  {
    time: 2.48, part: 'column-1', kicker: 'DEPENDENCY ORDER', title: '伸缩柱按依赖抬升',
    description: '下层先建立支撑，上层随后伸出。每条 sequence 只负责一个零件的一组 transform 通道。',
    channel: 'position.y · 1.02 → 1.72',
    extension: '状态事件 / 中断恢复 / 网络 startedAt',
    camera: [6.5, 4.5, 7.8], target: [0, 1.35, 0],
  },
  {
    time: 3.52, part: 'head', kicker: 'GROUP HIERARCHY', title: '塔头带着子零件就位',
    description: '塔头是 Group。翼板、灯和信标作为子节点随父级上升，同时保留各自的局部动画能力。',
    channel: 'position.y · 0.20 → 3.06',
    extension: 'GLB 节点映射 / Pivot 校验 / 选中检查',
    camera: [4.8, 4.3, 5.5], target: [0, 2.8, 0],
  },
  {
    time: 4.18, part: 'petal-0', kicker: 'HINGE MOTION', title: '翼板绕真实铰链展开',
    description: '旋转发生在铰链 Group，而不是面板中心。父级 pivot 决定机械动作是否可信。',
    channel: 'rotation.z · 1.35 → 0.35',
    extension: '机械约束 / swept-volume 审计 / 动画 LOD',
    camera: [4.1, 4.2, 4.8], target: [0, 3.15, 0],
  },
  {
    time: 4.65, part: 'head', kicker: 'LOCK + AUDIT', title: '锁扣落座，部署完成',
    description: '最后的轻微下压为锁扣声音提供真实运动来源；contract 与四类审计共同确认模型可交付。',
    channel: 'position.y · 3.06 → 3.02',
    extension: '质量门 / 性能预算 / 资产发布流水线',
    camera: [7.2, 5.1, 8.8], target: [0, 1.7, 0],
  },
];

const storyChapters = [
  {
    kicker: '00 / STANDBY', short: '待命', title: '荒原仍在沉睡',
    description: '没有建筑图标凭空落下。所有设施都停泊在地下，地表保持完整。',
    outcome: '零视觉噪声的隐藏基础设施', hold: 1.8,
    camera: [18, 12, 22], target: [0, 0.8, 0],
  },
  {
    kicker: '01 / SENSE', short: '侦察', title: '第一束信号寻找地平线',
    description: '通信碟率先部署，为后续设施提供观测与连接。故事先解释“为什么出现”，再展示“如何出现”。',
    outcome: '建立侦察覆盖', hold: 5.4,
    camera: [-10, 6.5, 7], target: [-6.5, 1.5, -3],
  },
  {
    kicker: '02 / CONNECT', short: '通路', title: '补给路线跨过裂谷',
    description: '桥梁从地下展开，把单个英雄装置扩展为空间关系：设施开始彼此服务。',
    outcome: '恢复人员与设备通路', hold: 5.2,
    camera: [11, 7, 13], target: [5.5, 0.8, 5],
  },
  {
    kicker: '03 / DEFEND', short: '防线', title: '防御节点依次升起',
    description: '瞭望塔与两台哨戒炮错峰部署。相同动画语法开始承担基地建造、节奏和风险窗口。',
    outcome: '形成可读的防御半径', hold: 6.6,
    camera: [15, 9, 18], target: [0.8, 1.6, 0.8],
  },
  {
    kicker: '04 / RESPOND', short: '响应', title: '威胁进入射界',
    description: '哨戒炮进入 alert clip。这里的动画不再只是装饰，而是明确表达“已发现、正在响应”。',
    outcome: '把状态变化转成玩家反馈', hold: 3.8,
    camera: [10, 5.5, 5], target: [5.8, 1.4, -2],
  },
  {
    kicker: '05 / ONLINE', short: '在线', title: '前哨成为一套系统',
    description: '镜头拉回全景：侦察、通路和防御共同构成产品，而不是五个互不相关的模型。',
    outcome: '从场景展示升级为产品叙事', hold: 6,
    camera: [19, 13, 24], target: [0, 1.2, 0.5],
  },
];

for (const [index, step] of techSteps.entries()) {
  const button = document.createElement('button');
  button.type = 'button';
  button.role = 'tab';
  button.textContent = String(index + 1).padStart(2, '0');
  button.setAttribute('aria-label', `${index + 1} ${step.title}`);
  button.onclick = () => selectTechStep(index);
  $('#tech-steps').append(button);
}

for (const [index, chapter] of storyChapters.entries()) {
  const item = document.createElement('li');
  const button = document.createElement('button');
  button.type = 'button';
  button.innerHTML = `<span>${chapter.kicker.split(' / ')[0]}</span><b>${chapter.short}</b>`;
  button.onclick = () => enterStoryChapter(index, false);
  item.append(button);
  $('#story-chapters').append(item);
}

for (const [index, family] of FAMILY_CATALOG.entries()) {
  const button = document.createElement('button');
  button.type = 'button';
  button.role = 'tab';
  button.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span><b>${family.label}</b>`;
  button.setAttribute('aria-label', `${index + 1} ${family.label}`);
  button.onclick = () => selectFamily(index);
  $('#family-tabs').append(button);
}

let renderer;
let scene;
let camera;
let controls;
let techRig;
let techTime = 0;
let techTargetTime = 0;
let techPlaying = false;
let techBox;
let storyEntries = [];
let storyChapter = 0;
let storyElapsed = 0;
let storyAuto = false;
let storySchedule = [];
let familyEntries = [];
let familyIndex = 0;
let familyItemIndex = 0;
let familyTime = 0;
let familyDuration = 0;
let familyPlaying = false;
let familyStage;
let familySelector;
let currentMode = 'original';
let cameraMotion = null;
let lastFrame = performance.now();

function setFallback(reason = 'FORCED') {
  originalView.classList.add('is-hidden');
  spatialView.classList.add('is-hidden');
  fallbackView.classList.remove('is-hidden');
  topStatusText.textContent = `可读降级路径 · ${reason}`;
  document.querySelectorAll('.mode-nav button').forEach((button) => { button.disabled = true; });
  window.showcase = { ready: true, mode: 'fallback', reason };
}

function moveCamera(position, target, duration = 1.1) {
  if (!camera || !controls) return;
  if (reducedMotion) {
    camera.position.fromArray(position);
    controls.target.fromArray(target);
    controls.update();
    cameraMotion = null;
    return;
  }
  cameraMotion = {
    elapsed: 0,
    duration,
    fromPosition: camera.position.clone(),
    toPosition: new THREE.Vector3().fromArray(position),
    fromTarget: controls.target.clone(),
    toTarget: new THREE.Vector3().fromArray(target),
  };
}

function updateCamera(dt) {
  if (!cameraMotion) return;
  cameraMotion.elapsed += dt;
  const raw = Math.min(1, cameraMotion.elapsed / cameraMotion.duration);
  const eased = raw < 0.5 ? 4 * raw ** 3 : 1 - ((-2 * raw + 2) ** 3) / 2;
  camera.position.lerpVectors(cameraMotion.fromPosition, cameraMotion.toPosition, eased);
  controls.target.lerpVectors(cameraMotion.fromTarget, cameraMotion.toTarget, eased);
  if (raw >= 1) cameraMotion = null;
}

function selectTechStep(index) {
  const step = techSteps[index];
  techPlaying = false;
  techTargetTime = step.time;
  document.querySelectorAll('#tech-steps button').forEach((button, buttonIndex) => {
    button.setAttribute('aria-selected', buttonIndex === index ? 'true' : 'false');
    button.tabIndex = buttonIndex === index ? 0 : -1;
  });
  $('#tech-index').textContent = String(index + 1).padStart(2, '0');
  $('#tech-kicker').textContent = step.kicker;
  $('#tech-title').textContent = step.title;
  $('#tech-description').textContent = step.description;
  $('#tech-part').textContent = step.part;
  $('#tech-channel').textContent = `${step.time.toFixed(2)}s · ${step.channel}`;
  $('#tech-extension').textContent = step.extension;
  if (techBox) scene.remove(techBox);
  const part = techRig.parts.find((candidate) => candidate.name === step.part);
  if (part) {
    techBox = new THREE.BoxHelper(part.object, 0x66dcff);
    techBox.material.depthTest = false;
    techBox.renderOrder = 20;
    scene.add(techBox);
  }
  moveCamera(step.camera, step.target);
}

function setRigDeployState(entry, deployed) {
  entry.rig.stop();
  entry.rig.setTime('deploy', deployed ? entry.rig.duration('deploy') : 0);
}

function setStoryBaseline(index) {
  storySchedule = [];
  for (const entry of storyEntries) setRigDeployState(entry, false);
  if (index >= 2) setRigDeployState(storyEntries.find((entry) => entry.id === 'dish'), true);
  if (index >= 3) setRigDeployState(storyEntries.find((entry) => entry.id === 'bridge'), true);
  if (index >= 4) {
    for (const entry of storyEntries.filter((candidate) => ['watchtower', 'sentry-east', 'sentry-west'].includes(candidate.id))) {
      setRigDeployState(entry, true);
    }
  }
  if (index >= 5) for (const entry of storyEntries) setRigDeployState(entry, true);
}

function scheduleStory(id, clip, at = 0) {
  const entry = storyEntries.find((candidate) => candidate.id === id);
  if (entry) storySchedule.push({ entry, clip, at, started: false });
}

function enterStoryChapter(index, preserveAuto = true) {
  storyChapter = Math.max(0, Math.min(storyChapters.length - 1, index));
  storyElapsed = 0;
  if (!preserveAuto) storyAuto = false;
  setStoryBaseline(storyChapter);
  if (storyChapter === 1) scheduleStory('dish', 'deploy');
  if (storyChapter === 2) scheduleStory('bridge', 'deploy');
  if (storyChapter === 3) {
    scheduleStory('watchtower', 'deploy', 0);
    scheduleStory('sentry-east', 'deploy', 0.38);
    scheduleStory('sentry-west', 'deploy', 0.76);
  }
  if (storyChapter === 4) {
    scheduleStory('sentry-east', 'alert', 0);
    scheduleStory('sentry-west', 'alert', 0.28);
  }
  const chapter = storyChapters[storyChapter];
  $('#story-kicker').textContent = chapter.kicker;
  $('#story-title').textContent = chapter.title;
  $('#story-description').textContent = chapter.description;
  $('#story-outcome').textContent = chapter.outcome;
  document.querySelectorAll('#story-chapters button').forEach((button, buttonIndex) => {
    if (buttonIndex === storyChapter) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  });
  moveCamera(chapter.camera, chapter.target, 1.35);
  updateStoryButton();
}

function updateStoryButton() {
  $('#story-play').textContent = storyAuto ? '暂停故事' : '播放完整故事';
}

function activeFamilyEntries() {
  const familyId = FAMILY_CATALOG[familyIndex].id;
  return familyEntries.filter((entry) => entry.family.id === familyId);
}

function selectedFamilyEntry() {
  return activeFamilyEntries()[familyItemIndex];
}

function generatedPhase(metadata, time) {
  if (!metadata) return null;
  const edge = metadata.phases.find((candidate) => time >= candidate.at && time < candidate.at + candidate.duration);
  return edge?.name || (time <= 0 ? 'stowed' : 'complete');
}

function updateFamilyEvidence(timeOverride) {
  const entry = selectedFamilyEntry();
  const metadata = entry?.rig.root.userData.generated;
  const strip = $('#family-state-strip');
  strip.classList.toggle('is-hidden', !metadata);
  if (!metadata) {
    $('#family-parameters').textContent = '独立母型 · 非参数化对象';
    $('#family-validation').textContent = '共享动作契约通过';
    $('#family-validation').dataset.pass = 'true';
    $('#family-cycle').textContent = 'deploy → work';
    return null;
  }
  const { config, rules, continuity } = metadata;
  $('#family-parameters').textContent = `L${config.chassisLength.toFixed(2)} · W${config.chassisWidth.toFixed(2)}m · ${config.wheelCount}轮 · ${config.payload}`;
  $('#family-validation').textContent = `${rules.checks.filter((check) => check.pass).length}/${rules.checks.length} PASS · continuity ${continuity.pass ? 'PASS' : 'FAIL'}`;
  $('#family-validation').dataset.pass = String(rules.pass && continuity.pass);
  $('#family-cycle').textContent = 'stowed → active → work → active → stowed';
  const localTime = timeOverride ?? Math.max(0, familyTime - familyItemIndex * 0.35);
  const phase = generatedPhase(metadata, localTime);
  strip.querySelectorAll('[data-phase]').forEach((cell) => cell.classList.toggle('is-active', cell.dataset.phase === phase));
  return phase;
}

function updateFamilyButton() {
  const generated = Boolean(selectedFamilyEntry()?.rig.root.userData.generated);
  $('#family-play').textContent = familyPlaying
    ? (generated ? '暂停连续周期' : '暂停本类能力')
    : (generated ? '播放连续周期' : '播放本类能力');
}

function resetFamilyPoses() {
  familyTime = 0;
  familyPlaying = false;
  for (const entry of activeFamilyEntries()) entry.rig.setTime('demo', 0);
  $('#family-progress').style.width = '0%';
  updateFamilyEvidence(0);
  updateFamilyButton();
}

function showFamilyInspectionPoses() {
  familyPlaying = false;
  familyTime = familyDuration;
  for (const entry of activeFamilyEntries()) entry.rig.setTime('demo', entry.rig.inspectionTime ?? entry.rig.duration('demo'));
  $('#family-progress').style.width = '100%';
  updateFamilyButton();
}

function selectFamilyItem(index, move = true) {
  const entries = activeFamilyEntries();
  familyItemIndex = Math.max(0, Math.min(entries.length - 1, index));
  const entry = entries[familyItemIndex];
  document.querySelectorAll('#family-items button').forEach((button, buttonIndex) => {
    if (buttonIndex === familyItemIndex) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  });
  $('#family-object-code').textContent = entry.item.id.toUpperCase();
  $('#family-object-title').textContent = entry.item.label;
  $('#family-capability').textContent = entry.item.capability;
  updateFamilyEvidence(entry.rig.inspectionTime ?? Math.max(0, familyTime - familyItemIndex * 0.35));
  const compact = innerWidth <= 860;
  const heroX = compact ? 0 : -1.2;
  const heroScale = entry.item.displayScale ?? 1.06;
  const companions = entries.filter((_, entryIndex) => entryIndex !== familyItemIndex);
  entries.forEach((candidate, candidateIndex) => {
    const selected = candidateIndex === familyItemIndex;
    candidate.rig.root.traverse((object) => {
      if (object.userData.detailEdge) object.visible = selected;
      if (object.userData.companionDetail) object.visible = selected;
      if (object.isMesh) object.castShadow = selected;
    });
  });
  entry.rig.root.position.set(heroX, 0, 0);
  entry.rig.root.rotation.y = -0.12;
  entry.rig.root.scale.setScalar(heroScale);
  companions.forEach((companion, companionIndex) => {
    const side = compact ? (companionIndex === 0 ? -5 : 5) : (companionIndex === 0 ? -5.55 : 3.35);
    companion.rig.root.position.set(side, 0, 0.55);
    companion.rig.root.rotation.y = side < 0 ? 0.28 : -0.28;
    companion.rig.root.scale.setScalar((companion.item.displayScale ?? 1) * 0.7);
  });
  if (familySelector) {
    familySelector.position.x = heroX;
    familySelector.visible = currentMode === 'families';
  }
  if (move) {
    moveCamera(compact ? [6.2, 5.0, 10.5] : [5.2, 4.0, 9.2], [heroX, 1.35, 0], 0.55);
  }
}

function selectFamily(index, move = true) {
  familyIndex = Math.max(0, Math.min(FAMILY_CATALOG.length - 1, index));
  const family = FAMILY_CATALOG[familyIndex];
  familyItemIndex = 0;
  for (const entry of familyEntries) {
    entry.rig.root.visible = currentMode === 'families' && entry.family.id === family.id;
  }
  document.querySelectorAll('#family-tabs button').forEach((button, buttonIndex) => {
    button.setAttribute('aria-selected', buttonIndex === familyIndex ? 'true' : 'false');
    button.tabIndex = buttonIndex === familyIndex ? 0 : -1;
  });
  $('#family-code').textContent = family.code;
  $('#family-thesis').textContent = family.thesis;
  $('#family-items').replaceChildren();
  for (const [itemIndex, entry] of activeFamilyEntries().entries()) {
    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = `<span>0${itemIndex + 1}</span><b>${entry.item.label}</b><small>${entry.item.capability}</small>`;
    button.onclick = () => selectFamilyItem(itemIndex);
    $('#family-items').append(button);
  }
  familyDuration = Math.max(...activeFamilyEntries().map((entry, itemIndex) => entry.rig.duration('demo') + itemIndex * 0.35));
  showFamilyInspectionPoses();
  selectFamilyItem(0, false);
  topStatusText.textContent = `对象族 · ${family.label} · 3 archetypes`;
  if (move) moveCamera(family.camera, family.target, 1.25);
}

function showMode(mode) {
  currentMode = mode;
  location.hash = mode;
  document.querySelectorAll('.mode-nav button').forEach((button) => {
    button.setAttribute('aria-pressed', button.dataset.mode === mode ? 'true' : 'false');
  });
  originalView.classList.toggle('is-hidden', mode !== 'original');
  spatialView.classList.toggle('is-hidden', mode === 'original');
  technicalPanel.classList.toggle('is-hidden', mode !== 'technical');
  storyPanel.classList.toggle('is-hidden', mode !== 'story');
  familyPanel.classList.toggle('is-hidden', mode !== 'families');
  spatialView.dataset.mode = mode;
  techRig.root.visible = mode === 'technical';
  if (techBox) techBox.visible = mode === 'technical';
  for (const entry of storyEntries) entry.rig.root.visible = mode === 'story';
  for (const entry of familyEntries) entry.rig.root.visible = mode === 'families' && entry.family.id === FAMILY_CATALOG[familyIndex].id;
  if (familyStage) familyStage.visible = mode === 'families';
  if (familySelector) familySelector.visible = mode === 'families';
  storyAuto = false;
  familyPlaying = false;
  updateStoryButton();
  updateFamilyButton();
  if (mode === 'original') {
    topStatusText.textContent = '上游原作运行中';
    return;
  }
  if (mode === 'technical') {
    sceneKicker.textContent = 'TECHNICAL ANATOMY';
    sceneTitle.textContent = '一台机器，如何从地下成立';
    sceneSummary.textContent = '按步骤查看物理来源、父子结构、声明式时间轴与自动审计。';
    topStatusText.textContent = '技术解剖 · watchtower';
    selectTechStep(0);
  } else if (mode === 'story') {
    sceneKicker.textContent = 'FRONTIER NODE / PRODUCT STORY';
    sceneTitle.textContent = '把模型，组织成一个前哨系统';
    sceneSummary.textContent = '六个节拍把分散设施变成“侦察—连接—防御—响应”的产品体验。';
    topStatusText.textContent = '极夜前哨 · 导演模式';
    enterStoryChapter(0, false);
  } else {
    sceneKicker.textContent = 'PHASE 01 / OBJECT FAMILY LAB';
    sceneTitle.textContent = '五个对象家族，十五个可运行母型';
    sceneSummary.textContent = '中央为当前检视对象；两侧保留同族对照。选择小类后播放完整机械动作。';
    selectFamily(familyIndex);
  }
}

function initScene() {
  renderer = new THREE.WebGLRenderer({ canvas: $('#stage'), antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.3));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05090d);
  scene.fog = new THREE.Fog(0x05090d, 23, 68);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xc7e7ff, 0x151b18, 1.15));
  const sun = new THREE.DirectionalLight(0xffe4bd, 3.0);
  sun.position.set(12, 17, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -26;
  sun.shadow.camera.right = sun.shadow.camera.top = 26;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x65cfff, 2.1);
  rim.position.set(-10, 7, -8);
  scene.add(rim);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(55, 72).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x1b211e, metalness: 0.08, roughness: 0.96 }),
  );
  ground.receiveShadow = true;
  scene.add(ground, new THREE.PolarGridHelper(45, 12, 8, 64, 0x334353, 0x1c2832));

  familyStage = new THREE.Group();
  familyStage.visible = false;
  const stageFloor = new THREE.Mesh(
    new THREE.BoxGeometry(18, 0.18, 8.5),
    new THREE.MeshStandardMaterial({ color: 0x101922, metalness: 0.62, roughness: 0.38 }),
  );
  stageFloor.position.set(0, 0.02, 0.3);
  stageFloor.receiveShadow = true;
  familyStage.add(stageFloor);
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(18, 6.4, 0.24),
    new THREE.MeshStandardMaterial({ color: 0x0c141c, metalness: 0.45, roughness: 0.48 }),
  );
  backWall.position.set(0, 3.15, -4.2);
  backWall.receiveShadow = true;
  familyStage.add(backWall);
  const stageLineMaterial = new THREE.MeshBasicMaterial({ color: 0x315466, transparent: true, opacity: 0.5 });
  for (const x of [-5.15, 0, 5.15]) {
    const bay = new THREE.Mesh(new THREE.RingGeometry(2.48, 2.52, 64), stageLineMaterial);
    bay.rotation.x = -Math.PI / 2;
    bay.position.set(x, 0.14, 0.35);
    familyStage.add(bay);
    const light = new THREE.SpotLight(0x8bdcff, x === 0 ? 18 : 9, 13, 0.48, 0.72, 1.4);
    light.position.set(x, 7.2, 2.3);
    light.target.position.set(x, 0.4, 0);
    familyStage.add(light, light.target);
  }
  for (let index = 0; index < 7; index += 1) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.04, 4.8, 0.03), stageLineMaterial);
    slat.position.set(-7.5 + index * 2.5, 3.1, -4.04);
    familyStage.add(slat);
  }
  familySelector = new THREE.Mesh(
    new THREE.RingGeometry(2.62, 2.73, 72),
    new THREE.MeshBasicMaterial({ color: 0x72ffd5, transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
  );
  familySelector.rotation.x = -Math.PI / 2;
  familySelector.position.y = 0.22;
  familyStage.add(familySelector);
  scene.add(familyStage);

  camera = new THREE.PerspectiveCamera(48, 1, 0.1, 140);
  camera.position.set(7, 5, 9);
  controls = new OrbitControls(camera, $('#stage'));
  controls.enableDamping = true;
  controls.target.set(0, 1.4, 0);
  controls.minDistance = 3;
  controls.maxDistance = 48;

  techRig = createWatchtower({ THREE, speed: 1.5 });
  scene.add(techRig.root);
  techRig.setTime('deploy', 0);

  const storySpecs = [
    { id: 'watchtower', factory: createWatchtower, position: [0, 0, 0.5] },
    { id: 'dish', factory: createDish, position: [-6.5, 0, -3] },
    { id: 'bridge', factory: createBridge, position: [5.5, 0, 5] },
    { id: 'sentry-east', factory: createSentry, position: [6, 0, -2] },
    { id: 'sentry-west', factory: createSentry, position: [-5, 0, 5] },
  ];
  storyEntries = storySpecs.map((spec) => {
    const rig = spec.factory({ THREE, speed: 1.5 });
    rig.root.position.fromArray(spec.position);
    rig.root.visible = false;
    rig.root.traverse((object) => { if (object.isMesh) object.castShadow = true; });
    scene.add(rig.root);
    return { ...spec, rig };
  });

  familyEntries = FAMILY_CATALOG.flatMap((family) => family.items.map((item, itemIndex) => {
    const rig = createFamilyObject({ THREE, family, item });
    rig.root.position.set((itemIndex - 1) * 6, 0, 0);
    rig.root.visible = false;
    scene.add(rig.root);
    return { family, item, itemIndex, rig };
  }));

  function resize() {
    const width = spatialView.clientWidth || innerWidth;
    const height = spatialView.clientHeight || innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  renderer.setAnimationLoop((now) => {
    const dt = Math.min(0.12, (now - lastFrame) / 1000);
    lastFrame = now;
    if (currentMode === 'technical') {
      if (techPlaying) {
        techTime = Math.min(techRig.duration('deploy'), techTime + dt * 1.5);
        if (techTime >= techRig.duration('deploy')) techPlaying = false;
      } else {
        techTime += (techTargetTime - techTime) * Math.min(1, dt * (reducedMotion ? 100 : 5));
      }
      techRig.setTime('deploy', techTime);
      if (techBox) techBox.update();
      sceneState.textContent = `DEPLOY ${techTime.toFixed(2)} / ${techRig.duration('deploy').toFixed(2)}s`;
    }
    if (currentMode === 'story') {
      storyElapsed += dt;
      for (const scheduled of storySchedule) {
        if (!scheduled.started && storyElapsed >= scheduled.at) {
          scheduled.entry.rig.play(scheduled.clip);
          scheduled.started = true;
        }
      }
      for (const entry of storyEntries) entry.rig.update(dt);
      const chapter = storyChapters[storyChapter];
      const localProgress = Math.min(1, storyElapsed / chapter.hold);
      const totalProgress = (storyChapter + localProgress) / storyChapters.length;
      $('#story-progress').style.width = `${totalProgress * 100}%`;
      sceneState.textContent = `${chapter.kicker} · ${Math.min(storyElapsed, chapter.hold).toFixed(1)}s`;
      if (storyAuto && storyElapsed >= chapter.hold) {
        if (storyChapter < storyChapters.length - 1) enterStoryChapter(storyChapter + 1, true);
        else { storyAuto = false; updateStoryButton(); }
      }
    }
    if (currentMode === 'families') {
      if (familyPlaying) familyTime = Math.min(familyDuration, familyTime + dt);
      for (const [itemIndex, entry] of activeFamilyEntries().entries()) {
        const localTime = Math.max(0, familyTime - itemIndex * 0.35);
        entry.rig.setTime('demo', localTime);
      }
      if (familyTime >= familyDuration) familyPlaying = false;
      $('#family-progress').style.width = `${familyDuration ? (familyTime / familyDuration) * 100 : 0}%`;
      const phase = updateFamilyEvidence();
      const metadata = selectedFamilyEntry()?.rig.root.userData.generated;
      sceneState.textContent = metadata
        ? `TRACKED V1 · ${(phase || 'ready').toUpperCase()} · ${familyTime.toFixed(2)}s · RULES ${metadata.rules.checks.filter((check) => check.pass).length}/${metadata.rules.checks.length}`
        : `${FAMILY_CATALOG[familyIndex].code} · ${familyTime.toFixed(2)} / ${familyDuration.toFixed(2)}s · 3 OBJECTS`;
      updateFamilyButton();
    }
    updateCamera(dt);
    controls.update();
    if (currentMode !== 'original') renderer.render(scene, camera);
  });

  $('#tech-play').onclick = () => {
    techTime = 0;
    techTargetTime = techRig.duration('deploy');
    techPlaying = true;
    if (techBox) techBox.visible = false;
    moveCamera([7.2, 5.1, 8.8], [0, 1.7, 0], 1.4);
  };
  $('#tech-reset').onclick = () => {
    techPlaying = false;
    techTime = 0;
    selectTechStep(0);
  };
  $('#story-play').onclick = () => {
    if (storyAuto) storyAuto = false;
    else {
      if (storyChapter >= storyChapters.length - 1) enterStoryChapter(0, true);
      storyAuto = true;
    }
    updateStoryButton();
  };
  $('#story-next').onclick = () => enterStoryChapter((storyChapter + 1) % storyChapters.length, false);
  $('#story-reset').onclick = () => enterStoryChapter(0, false);
  $('#family-play').onclick = () => {
    if (familyPlaying) familyPlaying = false;
    else {
      if (familyTime >= familyDuration) resetFamilyPoses();
      familyPlaying = true;
    }
    updateFamilyButton();
  };
  $('#family-next').onclick = () => selectFamily((familyIndex + 1) % FAMILY_CATALOG.length);
  $('#family-reset').onclick = resetFamilyPoses;
  document.querySelectorAll('.mode-nav button').forEach((button) => {
    button.onclick = () => showMode(button.dataset.mode);
  });

  selectTechStep(0);
  const requestedMode = location.hash.slice(1);
  showMode(['original', 'technical', 'story', 'families'].includes(requestedMode) ? requestedMode : 'original');
  window.showcase = {
    ready: true,
    mode: () => currentMode,
    showMode,
    tech: () => ({ time: techTime, target: techTargetTime }),
    story: () => ({ chapter: storyChapter, elapsed: storyElapsed, auto: storyAuto }),
    storyEntries: () => storyEntries,
    families: () => ({
      family: FAMILY_CATALOG[familyIndex].id,
      item: activeFamilyEntries()[familyItemIndex]?.item.id,
      time: familyTime,
      playing: familyPlaying,
      visible: activeFamilyEntries().filter((entry) => entry.rig.root.visible).length,
      catalog: catalogSummary(),
      generated: selectedFamilyEntry()?.rig.root.userData.generated ? {
        generator: selectedFamilyEntry().rig.root.userData.generated.generator,
        config: selectedFamilyEntry().rig.root.userData.generated.config,
        rules: {
          pass: selectedFamilyEntry().rig.root.userData.generated.rules.pass,
          checks: selectedFamilyEntry().rig.root.userData.generated.rules.checks,
        },
        continuity: {
          pass: selectedFamilyEntry().rig.root.userData.generated.continuity.pass,
          checks: selectedFamilyEntry().rig.root.userData.generated.continuity.checks,
        },
        phases: selectedFamilyEntry().rig.root.userData.generated.phases,
      } : null,
    }),
    renderer,
  };
}

if (forceFallback) setFallback('QUERY OVERRIDE');
else {
  try { initScene(); }
  catch (error) {
    console.warn('WebGL showcase unavailable; using readable fallback.', error);
    setFallback('WEBGL UNAVAILABLE');
  }
}
