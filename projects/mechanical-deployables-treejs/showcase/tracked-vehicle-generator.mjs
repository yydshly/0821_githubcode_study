import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ch, createRig, seq } from '../upstream/lib/contract.js';
import {
  STATE_GRAPH,
  createTrackedVehiclePoses,
  normalizeTrackedVehicleConfig,
  validateStateContinuity,
  validateTrackedVehicleConfig,
} from './tracked-vehicle-rules.mjs';

const PALETTES = {
  turret: { hull: 0x66785a, panel: 0x303a31, accent: 0xffb65f },
  radar: { hull: 0x5c7480, panel: 0x2d3c45, accent: 0x6fe4ff },
  engineer: { hull: 0x8b6c36, panel: 0x423629, accent: 0xffd265 },
};

function createMaterials(THREE, payload) {
  const palette = PALETTES[payload];
  return {
    hull: new THREE.MeshStandardMaterial({ color: palette.hull, metalness: 0.72, roughness: 0.3 }),
    panel: new THREE.MeshStandardMaterial({ color: palette.panel, metalness: 0.6, roughness: 0.42 }),
    accent: new THREE.MeshStandardMaterial({ color: palette.accent, emissive: palette.accent, emissiveIntensity: 1.05, metalness: 0.45, roughness: 0.22 }),
    track: new THREE.MeshStandardMaterial({ color: 0x11171b, metalness: 0.58, roughness: 0.5 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x090d10, metalness: 0.12, roughness: 0.86 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x83d5e8, emissive: 0x123542, emissiveIntensity: 0.58, metalness: 0.05, roughness: 0.08, transparent: true, opacity: 0.84 }),
    edge: new THREE.LineBasicMaterial({ color: 0xc4d6dc, transparent: true, opacity: 0.18, depthWrite: false }),
  };
}

function createBuilderContext(THREE, config) {
  const root = new THREE.Group();
  root.name = config.id;
  const model = new THREE.Group();
  model.name = 'metric-model';
  model.scale.setScalar(0.62);
  root.add(model);
  const parts = [];
  const mat = createMaterials(THREE, config.payload);

  function part(name, parent = model, group = 'assembly', explode = [0, 0.22, 0]) {
    const object = new THREE.Group();
    object.name = name;
    parent.add(object);
    parts.push({ name, group, index: parts.length, object, explode });
    return object;
  }

  function mesh(parent, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0]) {
    const object = new THREE.Mesh(geometry, material);
    object.position.fromArray(position);
    object.rotation.set(...rotation);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }

  function box(parent, size, position, material = mat.hull, rotation = [0, 0, 0], detail = false) {
    const radius = Math.max(0.012, Math.min(0.14, Math.min(...size) * 0.17));
    const object = mesh(parent, new RoundedBoxGeometry(...size, 2, radius), material, position, rotation);
    object.userData.companionDetail = detail;
    if (!detail && Math.max(...size) >= 0.75) {
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(object.geometry, 42), mat.edge);
      edges.userData.detailEdge = true;
      object.add(edges);
    }
    return object;
  }

  function cylinder(parent, rt, rb, height, position, material = mat.hull, rotation = [0, 0, 0], segments = 20, detail = false) {
    const object = mesh(parent, new THREE.CylinderGeometry(rt, rb, height, segments), material, position, rotation);
    object.userData.companionDetail = detail;
    return object;
  }

  function sphere(parent, radius, position, material = mat.hull, detail = false) {
    const object = mesh(parent, new THREE.SphereGeometry(radius, 18, 12), material, position);
    object.userData.companionDetail = detail;
    return object;
  }

  function pedestal() {
    cylinder(root, 2.38, 2.5, 0.18, [0, 0.05, 0], mat.track, [0, 0, 0], 36);
    cylinder(root, 2.18, 2.18, 0.035, [0, 0.16, 0], mat.panel, [0, 0, 0], 36);
    mesh(root, new THREE.TorusGeometry(2.15, 0.035, 8, 72), mat.accent, [0, 0.19, 0], [Math.PI / 2, 0, 0]);
  }

  return { THREE, config, root, model, parts, mat, part, mesh, box, cylinder, sphere, pedestal };
}

function buildSharedChassis(ctx) {
  const { config, part, box, cylinder, mat } = ctx;
  const chassis = part('chassis', undefined, 'chassis', [0, 0.45, 0]);
  const wheelCenterY = config.clearance + config.wheelRadius;
  const trackHeight = config.wheelRadius * 2.24;
  const lowerY = wheelCenterY + config.wheelRadius * 0.5;

  for (const [sideIndex, side] of [-1, 1].entries()) {
    const track = part(side < 0 ? 'left-track' : 'right-track', chassis, 'mobility', [0, 0.1, side * 0.8]);
    track.position.z = side * config.trackOffset;
    box(track, [config.trackRun + config.wheelRadius * 0.8, trackHeight, config.trackWidth], [0, wheelCenterY, 0], mat.track);
    box(track, [config.trackRun * 0.92, trackHeight * 0.56, config.trackWidth + 0.035], [0, wheelCenterY, side * 0.02], mat.panel);
    for (let index = 0; index < config.wheelCount; index += 1) {
      const x = -config.trackRun / 2 + index * config.wheelSpacing;
      cylinder(track, config.wheelRadius, config.wheelRadius, config.trackWidth * 1.08, [x, wheelCenterY, side * 0.035], mat.rubber, [Math.PI / 2, 0, 0], 20);
      cylinder(track, config.wheelRadius * 0.46, config.wheelRadius * 0.46, config.trackWidth * 1.13, [x, wheelCenterY, side * 0.04], sideIndex ? mat.accent : mat.hull, [Math.PI / 2, 0, 0], 16, index > 0 && index < config.wheelCount - 1);
    }
  }

  box(chassis, [config.chassisLength * 0.78, config.hullHeight * 0.5, config.hullWidth], [0, lowerY, 0], mat.hull);
  box(chassis, [config.chassisLength * 0.58, config.hullHeight * 0.42, config.hullWidth * 0.88], [-config.chassisLength * 0.08, lowerY + config.hullHeight * 0.42, 0], mat.panel);
  box(chassis, [config.chassisLength * 0.18, config.hullHeight * 0.34, config.hullWidth * 0.86], [config.chassisLength * 0.36, lowerY + config.hullHeight * 0.34, 0], mat.hull, [0, 0, -0.34]);
  box(chassis, [config.chassisLength * 0.12, config.hullHeight * 0.26, config.hullWidth * 0.8], [-config.chassisLength * 0.4, lowerY + config.hullHeight * 0.34, 0], mat.panel, [0, 0, 0.16]);
  for (const side of [-1, 1]) {
    box(chassis, [config.chassisLength * 0.62, 0.08, 0.1], [-0.05, lowerY + config.hullHeight * 0.72, side * config.hullWidth * 0.46], mat.accent, [0, 0, 0], true);
  }

  const socket = new ctx.THREE.Group();
  socket.name = 'payload-socket';
  socket.position.y = config.socketY;
  chassis.add(socket);
  cylinder(socket, config.hullWidth * 0.22, config.hullWidth * 0.26, 0.16, [0, 0, 0], mat.panel, [0, 0, 0], 28);
  ctx.mesh(socket, new ctx.THREE.TorusGeometry(config.hullWidth * 0.22, 0.035, 8, 48), mat.accent, [0, 0.1, 0], [Math.PI / 2, 0, 0]);
  return { chassis, socket, lowerY };
}

function buildTurretPayload(ctx, socket) {
  const { config, part, box, cylinder, sphere, mat } = ctx;
  const lift = part('payload-lift', socket, 'payload', [0, 0.5, 0]);
  const turret = part('turret', lift, 'payload', [0, 0.65, 0]);
  cylinder(turret, config.hullWidth * 0.27, config.hullWidth * 0.33, 0.34, [0, 0.2, 0], mat.hull, [0, 0, 0], 28);
  box(turret, [config.chassisLength * 0.25, 0.46, config.hullWidth * 0.52], [0.05, 0.5, 0], mat.hull);
  box(turret, [config.chassisLength * 0.14, 0.32, config.hullWidth * 0.42], [-config.chassisLength * 0.08, 0.76, 0], mat.panel, [0, 0, 0.1]);
  const barrelAnchor = new ctx.THREE.Group();
  barrelAnchor.position.set(config.chassisLength * 0.11, 0.5, 0);
  turret.add(barrelAnchor);
  const barrel = part('barrel', barrelAnchor, 'weapon', [1.1, 0.28, 0]);
  cylinder(barrel, 0.09, 0.14, config.chassisLength * 0.62, [config.chassisLength * 0.31, 0, 0], mat.panel, [0, 0, Math.PI / 2], 16);
  cylinder(barrel, 0.16, 0.16, 0.32, [config.chassisLength * 0.63, 0, 0], mat.accent, [0, 0, Math.PI / 2], 16, true);
  const sensorAnchor = new ctx.THREE.Group();
  sensorAnchor.position.set(-config.chassisLength * 0.08, 0.82, -config.hullWidth * 0.18);
  turret.add(sensorAnchor);
  const sensor = part('sensor-mast', sensorAnchor, 'sensor', [0, 0.4, 0]);
  cylinder(sensor, 0.055, 0.075, 0.6, [0, 0.3, 0], mat.panel, [0, 0, 0], 14);
  sphere(sensor, 0.13, [0, 0.63, 0], mat.glass);
}

function buildRadarPayload(ctx, socket) {
  const { config, part, box, cylinder, mat } = ctx;
  const lift = part('payload-lift', socket, 'payload', [0, 0.5, 0]);
  box(lift, [config.hullWidth * 0.55, 0.34, config.hullWidth * 0.55], [0, 0.25, 0], mat.panel);
  const mast = part('mast-inner', lift, 'sensor', [0, 0.8, 0]);
  cylinder(mast, 0.15, 0.22, 1.55, [0, 0.95, 0], mat.hull, [0, 0, 0], 18);
  cylinder(mast, 0.07, 0.1, 1.7, [0, 1.9, 0], mat.accent, [0, 0, 0], 16);
  const head = part('radar-head', mast, 'sensor', [0, 0.7, 0]);
  head.position.y = 2.72;
  cylinder(head, 0.34, 0.42, 0.24, [0, 0, 0], mat.panel, [0, 0, 0], 22);
  const panel = part('radar-panel', head, 'sensor', [0, 0.8, 0]);
  panel.position.y = 0.18;
  box(panel, [0.18, 1.45, 2.15], [0, 0.55, 0], mat.hull, [0, 0, 0]);
  box(panel, [0.1, 1.1, 1.82], [0.11, 0.55, 0], mat.glass, [0, 0, 0], true);
  for (const z of [-0.62, 0, 0.62]) box(panel, [0.12, 1.22, 0.05], [0.18, 0.55, z], mat.accent, [0, 0, 0], true);
}

function buildEngineerPayload(ctx, socket) {
  const { config, part, box, cylinder, mat } = ctx;
  const lift = part('payload-lift', socket, 'payload', [0, 0.5, 0]);
  box(lift, [config.hullWidth * 0.58, 0.34, config.hullWidth * 0.5], [-0.15, 0.25, 0], mat.panel);
  const boom = part('boom', lift, 'tool', [1.2, 0.7, 0]);
  boom.position.set(-config.chassisLength * 0.11, 0.45, 0);
  cylinder(boom, 0.24, 0.28, 0.42, [0, 0, 0], mat.accent, [Math.PI / 2, 0, 0], 18);
  box(boom, [config.chassisLength * 0.48, 0.28, 0.34], [config.chassisLength * 0.24, 0, 0], mat.hull);
  const extensionAnchor = new ctx.THREE.Group();
  extensionAnchor.position.x = config.chassisLength * 0.35;
  boom.add(extensionAnchor);
  const extension = part('extension', extensionAnchor, 'tool', [1, 0.3, 0]);
  box(extension, [config.chassisLength * 0.34, 0.2, 0.26], [config.chassisLength * 0.17, 0, 0], mat.panel);
  const claw = part('claw', extension, 'tool', [0.5, -0.2, 0]);
  claw.position.set(config.chassisLength * 0.34, 0, 0);
  box(claw, [0.62, 0.16, 0.18], [0.28, 0.18, 0.2], mat.accent, [0.22, 0, 0.3]);
  box(claw, [0.62, 0.16, 0.18], [0.28, 0.18, -0.2], mat.accent, [-0.22, 0, 0.3]);
  cylinder(lift, 0.07, 0.07, 0.8, [-config.chassisLength * 0.28, 0.75, 0], mat.accent, [0, 0, 0], 14, true);
}

function transitionSequences(poses, edge) {
  const from = poses[edge.from];
  const to = poses[edge.to];
  const partNames = new Set([...Object.keys(from), ...Object.keys(to)]);
  const sequences = [];
  for (const partName of partNames) {
    const fromChannels = from[partName] || {};
    const toChannels = to[partName] || {};
    const targets = new Set([...Object.keys(fromChannels), ...Object.keys(toChannels)]);
    const channels = [...targets].map((target) => ch(target, fromChannels[target] ?? toChannels[target], toChannels[target] ?? fromChannels[target]));
    if (!channels.some((channel) => channel.from !== channel.to)) continue;
    sequences.push(seq(`${edge.name}-${partName}`, partName, edge.at, edge.duration, channels));
  }
  return sequences;
}

export function createTrackedVehicle({ THREE, config: inputConfig }) {
  const config = normalizeTrackedVehicleConfig(inputConfig);
  const rules = validateTrackedVehicleConfig(config);
  const continuity = validateStateContinuity(config);
  const poses = createTrackedVehiclePoses(config);
  const ctx = createBuilderContext(THREE, config);
  ctx.pedestal();
  const { socket } = buildSharedChassis(ctx);
  if (config.payload === 'turret') buildTurretPayload(ctx, socket);
  if (config.payload === 'radar') buildRadarPayload(ctx, socket);
  if (config.payload === 'engineer') buildEngineerPayload(ctx, socket);

  const sequences = STATE_GRAPH.flatMap((edge) => transitionSequences(poses, edge));
  const rig = createRig({
    name: config.label,
    root: ctx.root,
    parts: ctx.parts,
    clips: { demo: { name: 'demo', sequences } },
  });
  rig.inspectionTime = STATE_GRAPH[0].duration;
  rig.root.userData.generated = {
    generator: 'tracked-vehicle-v1',
    config,
    rules,
    continuity,
    phases: STATE_GRAPH.map((edge) => ({ ...edge })),
    inspectionTime: rig.inspectionTime,
  };
  return rig;
}
