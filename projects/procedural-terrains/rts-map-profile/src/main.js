import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { generateRtsMap, sampleMap, serializeRtsMap } from './generator.js';

const HEIGHT_SCALE = 175;
const ui = {
  scene: document.querySelector('#scene-webgl'),
  fallback: document.querySelector('#fallback-stage'),
  fallbackMap: document.querySelector('#fallback-map'),
  tacticalMap: document.querySelector('#tactical-map'),
  seed: document.querySelector('#seed-input'),
  roughness: document.querySelector('#roughness-input'),
  ridge: document.querySelector('#ridge-input'),
  water: document.querySelector('#water-input'),
  roughnessOutput: document.querySelector('#roughness-output'),
  ridgeOutput: document.querySelector('#ridge-output'),
  waterOutput: document.querySelector('#water-output'),
  runStatus: document.querySelector('#run-status'),
  seedStatus: document.querySelector('#seed-status'),
  gridStatus: document.querySelector('#grid-status'),
  symmetry: document.querySelector('#metric-symmetry'),
  walkable: document.querySelector('#metric-walkable'),
  buildable: document.querySelector('#metric-buildable'),
  routes: document.querySelector('#metric-routes'),
  inspector: document.querySelector('#cell-inspector'),
  toast: document.querySelector('#toast'),
  panel: document.querySelector('#control-panel'),
  backdrop: document.querySelector('#panel-backdrop'),
  openPanel: document.querySelector('#open-panel'),
  closePanel: document.querySelector('#close-panel'),
};

const presets = {
  balanced: { roughness: 0.58, ridgeStrength: 0.62, waterLevel: 0.2 },
  open: { roughness: 0.36, ridgeStrength: 0.28, waterLevel: 0.16 },
  highlands: { roughness: 0.78, ridgeStrength: 0.88, waterLevel: 0.18 },
};

let map = null;
let currentView = 'terrain';
let renderer = null;
let scene = null;
let camera = null;
let controls = null;
let terrainMesh = null;
let waterMesh = null;
let markers = null;
let animationFrame = null;
let resizeObserver = null;
let regenerateTimer = null;
let toastTimer = null;
let panelTrigger = null;

const color = new THREE.Color();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function setColorForCell(target, index, view) {
  const height = map.heights[index];
  const slope = map.slopes[index];
  const isRoad = Boolean(map.roadMask[index]);
  const isBase = Boolean(map.baseMask[index]);
  const isWalkable = Boolean(map.walkable[index]);
  const isBuildable = Boolean(map.buildable[index]);

  if (view === 'walkable') {
    target.set(isWalkable ? '#66bc68' : '#492f2a');
    if (height <= map.params.waterLevel) target.set('#16333a');
    return target;
  }
  if (view === 'buildable') {
    target.set(isBuildable ? '#59aed0' : '#27332d');
    if (height <= map.params.waterLevel) target.set('#142c34');
    return target;
  }
  if (view === 'strategic') {
    if (isBase) target.set('#5facca');
    else if (isRoad) target.set('#b57f48');
    else if (height <= map.params.waterLevel) target.set('#183943');
    else target.set(isWalkable ? '#506b4d' : '#3c443c');
    return target;
  }

  if (height <= map.params.waterLevel + 0.012) target.set('#775f41');
  else if (height < 0.34) target.set('#4d7a46');
  else if (height < 0.47) target.set('#66834e');
  else if (height < 0.62) target.set(slope > 0.045 ? '#777869' : '#70835a');
  else target.set('#a8aaa0');
  if (isRoad) target.lerp(new THREE.Color('#a7794d'), 0.64);
  if (isBase) target.lerp(new THREE.Color('#7bb6bb'), 0.26);
  return target;
}

function createTerrainGeometry() {
  const size = map.size;
  const worldSize = map.params.worldSize;
  const vertexCount = size * size;
  const positions = new Float32Array(vertexCount * 3);
  const colors = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const indices = new Uint32Array((size - 1) * (size - 1) * 6);

  let vertex = 0;
  for (let z = 0; z < size; z += 1) {
    const nz = (z / (size - 1)) * 2 - 1;
    for (let x = 0; x < size; x += 1) {
      const nx = (x / (size - 1)) * 2 - 1;
      const idx = z * size + x;
      positions[vertex * 3] = nx * worldSize * 0.5;
      positions[vertex * 3 + 1] = map.heights[idx] * HEIGHT_SCALE;
      positions[vertex * 3 + 2] = nz * worldSize * 0.5;
      setColorForCell(color, idx, currentView);
      colors[vertex * 3] = color.r;
      colors[vertex * 3 + 1] = color.g;
      colors[vertex * 3 + 2] = color.b;
      uvs[vertex * 2] = x / (size - 1);
      uvs[vertex * 2 + 1] = z / (size - 1);
      vertex += 1;
    }
  }

  let offset = 0;
  for (let z = 0; z < size - 1; z += 1) {
    for (let x = 0; x < size - 1; x += 1) {
      const a = z * size + x;
      const b = a + 1;
      const c = a + size;
      const d = c + 1;
      indices[offset++] = a;
      indices[offset++] = c;
      indices[offset++] = b;
      indices[offset++] = b;
      indices[offset++] = c;
      indices[offset++] = d;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function normalizedToWorld(x, z, lift = 0) {
  const sample = sampleMap(map, x, z);
  return new THREE.Vector3(
    x * map.params.worldSize * 0.5,
    sample.height * HEIGHT_SCALE + lift,
    z * map.params.worldSize * 0.5,
  );
}

function createRouteLine(route) {
  const points = [];
  for (let segment = 0; segment < route.points.length - 1; segment += 1) {
    const from = route.points[segment];
    const to = route.points[segment + 1];
    for (let step = 0; step < 12; step += 1) {
      const t = step / 12;
      points.push(normalizedToWorld(
        THREE.MathUtils.lerp(from[0], to[0], t),
        THREE.MathUtils.lerp(from[1], to[1], t),
        3.5,
      ));
    }
  }
  const end = route.points.at(-1);
  points.push(normalizedToWorld(end[0], end[1], 3.5));
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: 0xe1a45c, transparent: true, opacity: 0.92 });
  const line = new THREE.Line(geometry, material);
  line.userData.kind = 'route';
  return line;
}

function addStrategicMarkers(group) {
  const baseGeometry = new THREE.RingGeometry(44, 57, 48);
  const alphaMaterial = new THREE.MeshBasicMaterial({ color: 0x63b9df, side: THREE.DoubleSide, transparent: true, opacity: 0.86 });
  const bravoMaterial = new THREE.MeshBasicMaterial({ color: 0xe07359, side: THREE.DoubleSide, transparent: true, opacity: 0.86 });

  for (const spawn of map.spawnPoints) {
    const ring = new THREE.Mesh(baseGeometry, spawn.faction === 'alpha' ? alphaMaterial : bravoMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(normalizedToWorld(spawn.x, spawn.z, 4.5));
    ring.userData = { kind: 'spawn', id: spawn.id };
    group.add(ring);
  }

  const resourceGeometry = new THREE.OctahedronGeometry(10, 0);
  const resourceMaterial = new THREE.MeshStandardMaterial({
    color: 0xefb54a,
    emissive: 0x5a3510,
    emissiveIntensity: 0.65,
    roughness: 0.48,
    metalness: 0.18,
  });
  for (const resource of map.resources) {
    const crystal = new THREE.Mesh(resourceGeometry, resourceMaterial);
    crystal.position.copy(normalizedToWorld(resource.x, resource.z, 14));
    crystal.scale.set(0.8, 1.25, 0.8);
    crystal.userData = { kind: 'resource', id: resource.id };
    group.add(crystal);
  }

  const chokeGeometry = new THREE.TorusGeometry(18, 3.2, 8, 32);
  const chokeMaterial = new THREE.MeshBasicMaterial({ color: 0xe76c55, transparent: true, opacity: 0.88 });
  for (const objective of map.objectives) {
    const marker = new THREE.Mesh(chokeGeometry, chokeMaterial);
    marker.rotation.x = -Math.PI / 2;
    marker.position.copy(normalizedToWorld(objective.x, objective.z, 6));
    marker.userData = { kind: objective.type, id: objective.id };
    group.add(marker);
  }

  for (const route of map.routes) group.add(createRouteLine(route));
}

function disposeObject(object) {
  object?.traverse?.((child) => {
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose?.());
    else child.material?.dispose?.();
  });
}

function rebuildScene() {
  if (!renderer || !scene) return;
  if (terrainMesh) {
    scene.remove(terrainMesh);
    disposeObject(terrainMesh);
  }
  if (waterMesh) {
    scene.remove(waterMesh);
    disposeObject(waterMesh);
  }
  if (markers) {
    scene.remove(markers);
    disposeObject(markers);
  }

  terrainMesh = new THREE.Mesh(
    createTerrainGeometry(),
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.86,
      metalness: 0,
      side: THREE.DoubleSide,
    }),
  );
  terrainMesh.userData.kind = 'terrain';
  scene.add(terrainMesh);

  const waterGeometry = new THREE.PlaneGeometry(map.params.worldSize * 1.06, map.params.worldSize * 1.06);
  const waterMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x174853,
    transparent: true,
    opacity: 0.58,
    roughness: 0.3,
    metalness: 0.05,
    depthWrite: false,
  });
  waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.y = map.params.waterLevel * HEIGHT_SCALE + 0.8;
  scene.add(waterMesh);

  markers = new THREE.Group();
  markers.name = 'StrategicMarkers';
  addStrategicMarkers(markers);
  scene.add(markers);
}

function updateTerrainColors() {
  if (!terrainMesh) return;
  const attribute = terrainMesh.geometry.getAttribute('color');
  for (let index = 0; index < map.heights.length; index += 1) {
    setColorForCell(color, index, currentView);
    attribute.setXYZ(index, color.r, color.g, color.b);
  }
  attribute.needsUpdate = true;
  markers.visible = currentView === 'strategic' || currentView === 'terrain';
}

function initWebGL() {
  if (new URLSearchParams(window.location.search).get('fallback') === '1') {
    throw new Error('Fallback mode requested');
  }

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.setAttribute('aria-label', '可旋转的 RTS 三维地形地图');
  ui.scene.append(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07100b);
  scene.fog = new THREE.FogExp2(0x07100b, 0.00072);

  camera = new THREE.PerspectiveCamera(43, 1, 1, 4000);
  camera.position.set(720, 710, 820);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.target.set(0, 42, 0);
  controls.minDistance = 480;
  controls.maxDistance = 1900;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.minPolarAngle = Math.PI * 0.17;
  controls.enablePan = false;

  scene.add(new THREE.HemisphereLight(0xcfe5d4, 0x18231c, 1.5));
  const sun = new THREE.DirectionalLight(0xffedcf, 2.35);
  sun.position.set(-460, 720, 330);
  scene.add(sun);

  const resize = () => {
    const width = Math.max(1, ui.scene.clientWidth);
    const height = Math.max(1, ui.scene.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(ui.scene);
  resize();

  let pointerStart = null;
  renderer.domElement.addEventListener('pointerdown', (event) => {
    pointerStart = { x: event.clientX, y: event.clientY };
  });
  renderer.domElement.addEventListener('pointerup', (event) => {
    if (!pointerStart || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 5) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(terrainMesh, false)[0];
    if (!hit) return;
    inspectNormalized(
      hit.point.x / (map.params.worldSize * 0.5),
      hit.point.z / (map.params.worldSize * 0.5),
    );
  });

  const animate = () => {
    controls.update();
    renderer.render(scene, camera);
    animationFrame = requestAnimationFrame(animate);
  };
  animate();
}

function mapColorCss(index, view) {
  setColorForCell(color, index, view);
  return `#${color.getHexString()}`;
}

function drawTacticalMap(canvas) {
  if (!canvas || !map) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const width = canvas.width;
  const height = canvas.height;
  const cellW = width / map.size;
  const cellH = height / map.size;
  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = false;

  for (let z = 0; z < map.size; z += 1) {
    for (let x = 0; x < map.size; x += 1) {
      const idx = z * map.size + x;
      ctx.fillStyle = mapColorCss(idx, currentView);
      ctx.fillRect(x * cellW, z * cellH, Math.ceil(cellW + 0.25), Math.ceil(cellH + 0.25));
    }
  }

  const toCanvas = ([x, z]) => [(x + 1) * 0.5 * width, (z + 1) * 0.5 * height];
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(239, 181, 74, 0.92)';
  ctx.lineWidth = Math.max(2, width * 0.008);
  for (const route of map.routes) {
    ctx.beginPath();
    route.points.forEach((point, index) => {
      const [x, y] = toCanvas(point);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  for (const spawn of map.spawnPoints) {
    const [x, y] = toCanvas([spawn.x, spawn.z]);
    ctx.beginPath();
    ctx.arc(x, y, width * 0.033, 0, Math.PI * 2);
    ctx.fillStyle = spawn.faction === 'alpha' ? '#66b9de' : '#e76c55';
    ctx.fill();
    ctx.lineWidth = Math.max(2, width * 0.005);
    ctx.strokeStyle = '#eef5ef';
    ctx.stroke();
  }

  for (const resource of map.resources) {
    const [x, y] = toCanvas([resource.x, resource.z]);
    const radius = width * 0.012;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#efb54a';
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
    ctx.restore();
  }
}

function updateAllMaps() {
  drawTacticalMap(ui.tacticalMap);
  drawTacticalMap(ui.fallbackMap);
}

function inspectNormalized(nx, nz) {
  const sample = sampleMap(map, nx, nz);
  ui.inspector.innerHTML = `
    <p class="eyebrow">CELL ${sample.cell.x}:${sample.cell.z}</p>
    <strong>${sample.buildable ? '可建造' : sample.walkable ? '仅可通行' : '不可通行'}</strong>
    <span>高度 ${(sample.height * HEIGHT_SCALE).toFixed(1)} · 坡度 ${(sample.slope * 100).toFixed(1)}% · ${sample.road ? '主路线' : sample.base ? '基地平整区' : '自然地形'}</span>
  `;
}

function updateMetrics(duration) {
  ui.runStatus.textContent = `已生成 · ${duration.toFixed(1)} ms`;
  ui.seedStatus.textContent = String(map.params.seed);
  ui.gridStatus.textContent = `${map.size} × ${map.size}`;
  ui.symmetry.textContent = `${Math.round(map.metrics.symmetryScore * 100)}%`;
  ui.walkable.textContent = `${Math.round(map.metrics.walkableRatio * 100)}%`;
  ui.buildable.textContent = `${Math.round(map.metrics.buildableRatio * 100)}%`;
  ui.routes.textContent = String(map.metrics.routeCount);
  document.body.dataset.seed = String(map.params.seed);
  document.body.dataset.mapReady = 'true';
}

function readParams() {
  return {
    seed: Number(ui.seed.value),
    roughness: Number(ui.roughness.value),
    ridgeStrength: Number(ui.ridge.value),
    waterLevel: Number(ui.water.value),
  };
}

function syncOutputs() {
  ui.roughnessOutput.value = Number(ui.roughness.value).toFixed(2);
  ui.ridgeOutput.value = Number(ui.ridge.value).toFixed(2);
  ui.waterOutput.value = Number(ui.water.value).toFixed(2);
}

function regenerate({ announce = true } = {}) {
  const started = performance.now();
  ui.runStatus.textContent = '正在生成…';
  map = generateRtsMap(readParams());
  const duration = performance.now() - started;
  rebuildScene();
  updateTerrainColors();
  updateAllMaps();
  updateMetrics(duration);
  inspectNormalized(0, -0.31);
  if (announce) showToast(`Seed ${map.params.seed} 已生成：2 个基地、2 条路线、6 个资源点。`);
}

function selectView(view) {
  currentView = view;
  document.querySelectorAll('[data-view]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.view === view));
  });
  updateTerrainColors();
  updateAllMaps();
  const labels = { terrain: '地形', walkable: '通行', buildable: '建造', strategic: '战略' };
  showToast(`已切换到${labels[view]}视图。`);
}

function showToast(message) {
  clearTimeout(toastTimer);
  ui.toast.textContent = message;
  ui.toast.hidden = false;
  toastTimer = setTimeout(() => {
    ui.toast.hidden = true;
  }, 2600);
}

function exportMap() {
  const payload = JSON.stringify(serializeRtsMap(map), null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `rts-map-${map.params.seed}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  document.body.dataset.exportedSeed = String(map.params.seed);
  ui.runStatus.textContent = '地图 JSON 已导出';
  showToast(`已导出 rts-map-${map.params.seed}.json`);
}

function applyPreset(name) {
  const preset = presets[name];
  if (!preset) return;
  ui.roughness.value = String(preset.roughness);
  ui.ridge.value = String(preset.ridgeStrength);
  ui.water.value = String(preset.waterLevel);
  syncOutputs();
  document.querySelectorAll('[data-preset]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.preset === name));
  });
  regenerate();
}

function openPanel() {
  panelTrigger = document.activeElement;
  document.body.classList.add('panel-open');
  ui.backdrop.hidden = false;
  ui.openPanel.setAttribute('aria-expanded', 'true');
  setTimeout(() => ui.closePanel.focus(), 190);
}

function closePanel() {
  document.body.classList.remove('panel-open');
  ui.backdrop.hidden = true;
  ui.openPanel.setAttribute('aria-expanded', 'false');
  if (panelTrigger instanceof HTMLElement) panelTrigger.focus();
}

function bindMapInspector(canvas) {
  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const nz = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    inspectNormalized(nx, nz);
  });
}

function bindUi() {
  document.querySelector('#generate-map').addEventListener('click', () => regenerate());
  document.querySelector('#random-seed').addEventListener('click', () => {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    ui.seed.value = String(buffer[0] % 1000000);
    regenerate();
  });
  ui.seed.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') regenerate();
  });
  for (const input of [ui.roughness, ui.ridge, ui.water]) {
    input.addEventListener('input', () => {
      syncOutputs();
      clearTimeout(regenerateTimer);
      regenerateTimer = setTimeout(() => regenerate({ announce: false }), 130);
    });
  }
  document.querySelectorAll('[data-preset]').forEach((button) => {
    button.addEventListener('click', () => applyPreset(button.dataset.preset));
  });
  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => selectView(button.dataset.view));
  });
  document.querySelector('#export-map').addEventListener('click', exportMap);
  document.querySelector('#export-top').addEventListener('click', exportMap);
  ui.openPanel.addEventListener('click', openPanel);
  ui.closePanel.addEventListener('click', closePanel);
  ui.backdrop.addEventListener('click', closePanel);
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('panel-open')) closePanel();
  });
  bindMapInspector(ui.tacticalMap);
  bindMapInspector(ui.fallbackMap);
}

function initialize() {
  syncOutputs();
  map = generateRtsMap(readParams());
  try {
    initWebGL();
    rebuildScene();
  } catch (error) {
    renderer = null;
    ui.scene.hidden = true;
    ui.fallback.hidden = false;
    document.body.dataset.renderMode = 'fallback';
    console.warn('[RTS Map Profile] WebGL unavailable; using data fallback.', error.message);
  }
  updateAllMaps();
  updateMetrics(0);
  inspectNormalized(0, -0.31);
  bindUi();
}

initialize();

window.addEventListener('beforeunload', () => {
  if (animationFrame) cancelAnimationFrame(animationFrame);
  resizeObserver?.disconnect();
  controls?.dispose();
  renderer?.dispose();
});
