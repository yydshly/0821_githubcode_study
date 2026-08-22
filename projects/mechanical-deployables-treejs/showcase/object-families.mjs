import { ch, createRig, seq } from '../upstream/lib/contract.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createTrackedVehicle } from './tracked-vehicle-generator.mjs';
import { TRACKED_VEHICLE_PRESETS } from './tracked-vehicle-rules.mjs';

const TAU = Math.PI * 2;

const palettes = {
  ground: { primary: 0x71835f, secondary: 0x303c34, accent: 0xffb85e },
  air: { primary: 0x8ba0af, secondary: 0x344653, accent: 0x67ddff },
  robot: { primary: 0x817d91, secondary: 0x383545, accent: 0xd79aff },
  industry: { primary: 0xa07d3f, secondary: 0x44382a, accent: 0xffcf67 },
  infrastructure: { primary: 0x6f8998, secondary: 0x30434c, accent: 0x72ffd5 },
};

function materials(THREE, palette) {
  return {
    primary: new THREE.MeshStandardMaterial({ color: palette.primary, metalness: 0.76, roughness: 0.27 }),
    secondary: new THREE.MeshStandardMaterial({ color: palette.secondary, metalness: 0.62, roughness: 0.38 }),
    accent: new THREE.MeshStandardMaterial({ color: palette.accent, emissive: palette.accent, emissiveIntensity: 1.15, metalness: 0.5, roughness: 0.2 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x11171d, metalness: 0.55, roughness: 0.52 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x8edcf0, emissive: 0x153b48, emissiveIntensity: 0.7, metalness: 0.08, roughness: 0.08, transmission: 0.12, transparent: true, opacity: 0.86 }),
    edge: new THREE.LineBasicMaterial({ color: 0xb8d2dd, transparent: true, opacity: 0.2, depthWrite: false }),
  };
}

function createContext(THREE, definition) {
  const root = new THREE.Group();
  root.name = definition.id;
  const parts = [];
  const mat = materials(THREE, palettes[definition.family]);

  function part(name, parent = root, group = 'assembly', explode = [0, 0.25, 0]) {
    const object = new THREE.Group();
    object.name = name;
    parent.add(object);
    parts.push({ name, group, index: parts.length, object, explode });
    return object;
  }

  function mesh(parent, geometry, material = mat.primary, position = [0, 0, 0], rotation = [0, 0, 0]) {
    const object = new THREE.Mesh(geometry, material);
    object.position.fromArray(position);
    object.rotation.set(...rotation);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }

  const box = (parent, size, position, material = mat.primary, rotation) => {
    const radius = Math.max(0.008, Math.min(0.12, Math.min(...size) * 0.2));
    const object = mesh(parent, new RoundedBoxGeometry(...size, 2, radius), material, position, rotation);
    object.userData.companionDetail = Math.max(...size) < 0.58;
    if (Math.max(...size) >= 0.7 && Math.min(...size) >= 0.1) {
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(object.geometry, 42), mat.edge);
      edges.renderOrder = 2;
      edges.userData.detailEdge = true;
      object.add(edges);
    }
    return object;
  };
  const cylinder = (parent, radiusTop, radiusBottom, height, position, material = mat.primary, rotation, segments = 18) => {
    const object = mesh(parent, new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material, position, rotation);
    object.userData.companionDetail = Math.max(radiusTop, radiusBottom) < 0.15 && height < 0.8;
    return object;
  };
  const sphere = (parent, radius, position, material = mat.primary) => {
    const object = mesh(parent, new THREE.SphereGeometry(radius, 18, 12), material, position);
    object.userData.companionDetail = radius < 0.14;
    return object;
  };
  const wheel = (parent, position, radius = 0.42, width = 0.28) => (
    cylinder(parent, radius, radius, width, position, mat.dark, [0, 0, Math.PI / 2], 20)
  );
  const pedestal = () => {
    cylinder(root, 2.22, 2.34, 0.18, [0, 0.05, 0], mat.dark, undefined, 32);
    cylinder(root, 2.05, 2.05, 0.035, [0, 0.16, 0], mat.secondary, undefined, 32);
    mesh(root, new THREE.TorusGeometry(2.02, 0.032, 8, 64), mat.accent, [0, 0.19, 0], [Math.PI / 2, 0, 0]);
  };

  return { THREE, definition, root, parts, mat, part, mesh, box, cylinder, sphere, wheel, pedestal };
}

function groundScout(ctx) {
  const { box, cylinder, mat, part, pedestal, wheel } = ctx;
  pedestal();
  const body = part('body', undefined, 'chassis');
  box(body, [2.7, 0.55, 1.35], [0, 0.72, 0], mat.primary);
  box(body, [1.25, 0.52, 1.08], [-0.25, 1.18, 0], mat.secondary);
  box(body, [0.52, 0.35, 0.95], [1.45, 0.72, 0], mat.primary);
  box(body, [0.08, 0.34, 0.88], [0.4, 1.2, 0], mat.glass, [0, 0, -0.12]);
  for (const z of [-0.4, 0.4]) box(body, [0.08, 0.14, 0.22], [1.73, 0.78, z], mat.accent);
  for (const x of [-0.85, 0.85]) for (const z of [-0.73, 0.73]) wheel(body, [x, 0.48, z]);
  const sensor = part('sensor', body, 'sensor', [0, 0.7, 0]);
  cylinder(sensor, 0.12, 0.12, 0.55, [0, 1.62, 0], mat.secondary);
  cylinder(sensor, 0.42, 0.32, 0.18, [0, 1.93, 0], mat.accent);
  const sequences = [
    seq('suspension-settle', 'body', 0, 1.2, [ch('position.y', -0.18, 0)]),
    seq('sensor-scan', 'sensor', 0.65, 2.4, [ch('rotation.y', 0, TAU)]),
  ];
  return sequences;
}

function groundTank(ctx) {
  const { box, cylinder, mat, part, pedestal, wheel } = ctx;
  pedestal();
  const chassis = part('chassis', undefined, 'chassis');
  box(chassis, [3, 0.55, 1.65], [0, 0.68, 0], mat.primary);
  box(chassis, [2.35, 0.35, 1.35], [-0.2, 1.08, 0], mat.secondary);
  box(chassis, [2.65, 0.16, 0.18], [0, 0.92, -0.88], mat.primary);
  box(chassis, [2.65, 0.16, 0.18], [0, 0.92, 0.88], mat.primary);
  for (const z of [-0.92, 0.92]) {
    box(chassis, [2.9, 0.38, 0.24], [0, 0.48, z], mat.dark);
    for (const x of [-0.95, 0, 0.95]) wheel(chassis, [x, 0.48, z], 0.38, 0.22);
  }
  const turret = part('turret', chassis, 'weapon', [0, 0.9, 0]);
  cylinder(turret, 0.8, 0.95, 0.42, [0, 1.42, 0], mat.primary, undefined, 24);
  box(turret, [1.2, 0.35, 1.1], [0, 1.62, 0], mat.primary);
  box(turret, [0.28, 0.18, 0.24], [0.62, 1.82, -0.32], mat.glass);
  cylinder(turret, 0.035, 0.035, 1.05, [-0.42, 2.15, 0.28], mat.accent);
  const barrel = part('barrel', turret, 'weapon', [1.2, 0.3, 0]);
  cylinder(barrel, 0.1, 0.14, 2.4, [1.2, 1.65, 0], mat.secondary, [0, 0, Math.PI / 2], 14);
  cylinder(barrel, 0.17, 0.17, 0.32, [2.42, 1.65, 0], mat.accent, [0, 0, Math.PI / 2], 14);
  return [
    seq('turret-acquire', 'turret', 0, 2.1, [ch('rotation.y', -0.75, 0.75)]),
    seq('barrel-elevate', 'barrel', 0.55, 1.15, [ch('rotation.z', -0.08, 0.18)]),
    seq('recoil', 'barrel', 2.2, 0.32, [ch('position.x', 0, -0.22)]),
    seq('return', 'barrel', 2.52, 0.55, [ch('position.x', -0.22, 0)]),
  ];
}

function groundEngineer(ctx) {
  const { box, cylinder, mat, part, pedestal, sphere, wheel } = ctx;
  pedestal();
  const chassis = part('chassis', undefined, 'chassis');
  box(chassis, [2.8, 0.52, 1.45], [0, 0.7, 0], mat.primary);
  box(chassis, [1.05, 0.8, 1.12], [-0.65, 1.22, 0], mat.secondary);
  box(chassis, [0.07, 0.44, 0.88], [-0.1, 1.32, 0], mat.glass, [0, 0, -0.08]);
  for (const z of [-0.48, 0.48]) box(chassis, [0.16, 0.12, 0.18], [1.38, 0.82, z], mat.accent);
  for (const x of [-0.85, 0.85]) for (const z of [-0.78, 0.78]) wheel(chassis, [x, 0.47, z], 0.39, 0.25);
  const boom = part('boom', chassis, 'tool', [1.1, 0.8, 0]);
  box(boom, [2.15, 0.22, 0.28], [0.72, 1.55, 0], mat.primary);
  const arm = part('arm', boom, 'tool', [1.3, 0.4, 0]);
  box(arm, [1.75, 0.19, 0.24], [2.55, 1.55, 0], mat.primary);
  const hook = part('hook', arm, 'tool', [0.4, -0.5, 0]);
  cylinder(hook, 0.06, 0.06, 0.92, [3.36, 1.05, 0], mat.accent);
  sphere(hook, 0.15, [3.36, 0.56, 0], mat.accent);
  return [
    seq('boom-lift', 'boom', 0, 1.5, [ch('rotation.z', 0.1, -0.55)]),
    seq('arm-extend', 'arm', 0.75, 1.4, [ch('position.x', -0.55, 0)]),
    seq('hook-lower', 'hook', 1.65, 1.15, [ch('position.y', 0.55, -0.25)]),
  ];
}

function airFixedWing(ctx) {
  const { box, cylinder, mat, part, pedestal } = ctx;
  pedestal();
  const fuselage = part('fuselage', undefined, 'airframe');
  cylinder(fuselage, 0.22, 0.55, 3.5, [0, 1.35, 0], mat.primary, [0, 0, Math.PI / 2], 20);
  box(fuselage, [1.1, 0.42, 0.58], [-0.35, 1.35, 0], mat.secondary);
  box(fuselage, [0.58, 0.26, 0.48], [0.78, 1.58, 0], mat.glass, [0, 0, -0.15]);
  box(fuselage, [0.55, 0.75, 0.12], [-1.28, 1.74, 0], mat.primary, [0, 0, -0.3]);
  box(fuselage, [0.9, 0.08, 1.45], [-1.18, 1.38, 0], mat.secondary);
  const leftWing = part('left-wing', fuselage, 'wing', [0, 0.5, 1.2]);
  box(leftWing, [1.8, 0.12, 1.4], [0.15, 1.34, 0.85], mat.primary, [0, -0.25, 0]);
  const rightWing = part('right-wing', fuselage, 'wing', [0, 0.5, -1.2]);
  box(rightWing, [1.8, 0.12, 1.4], [0.15, 1.34, -0.85], mat.primary, [0, 0.25, 0]);
  const gear = part('landing-gear', fuselage, 'gear', [0, -0.4, 0]);
  cylinder(gear, 0.06, 0.06, 0.85, [-0.5, 0.82, 0], mat.dark);
  cylinder(gear, 0.18, 0.18, 0.12, [-0.5, 0.38, 0], mat.dark, [0, 0, Math.PI / 2]);
  return [
    seq('wing-left', 'left-wing', 0, 1.5, [ch('rotation.x', -1.05, 0)]),
    seq('wing-right', 'right-wing', 0, 1.5, [ch('rotation.x', 1.05, 0)]),
    seq('gear-drop', 'landing-gear', 1.15, 1.05, [ch('position.y', 0.5, 0)]),
  ];
}

function airTiltRotor(ctx) {
  const { box, cylinder, mat, part, pedestal, sphere } = ctx;
  pedestal();
  const body = part('body', undefined, 'airframe');
  cylinder(body, 0.34, 0.52, 2.7, [0, 1.25, 0], mat.primary, [0, 0, Math.PI / 2], 24);
  const cockpit = sphere(body, 0.46, [1.3, 1.28, 0], mat.glass);
  cockpit.scale.set(1.3, 0.78, 0.9);
  box(body, [1.8, 0.26, 0.48], [-1.42, 1.28, 0], mat.secondary);
  box(body, [1.1, 0.16, 4.1], [0, 1.45, 0], mat.secondary);
  box(body, [0.9, 0.12, 1.7], [-1.35, 1.35, 0], mat.primary);
  box(body, [0.55, 0.72, 0.12], [-1.45, 1.72, 0], mat.primary, [0, 0, -0.25]);
  const sequences = [];
  for (const [index, z] of [-2.05, 2.05].entries()) {
    const nacelle = part(`nacelle-${index}`, body, 'propulsion', [0, 0.7, z > 0 ? 1 : -1]);
    nacelle.position.set(0, 1.55, z);
    cylinder(nacelle, 0.28, 0.34, 1.0, [0, 0, 0], mat.primary, undefined, 22);
    const rotor = part(`rotor-${index}`, nacelle, 'propulsion', [0, 0.8, z > 0 ? 1 : -1]);
    rotor.position.set(0, 0.5, 0);
    cylinder(rotor, 0.1, 0.1, 0.32, [0, 0, 0], mat.accent);
    box(rotor, [0.13, 0.06, 2.3], [0, 0.18, 0], mat.dark);
    sequences.push(seq(`tilt-${index}`, `nacelle-${index}`, 0, 1.45, [ch('rotation.z', -1.15, 0)]));
    sequences.push(seq(`spin-${index}`, `rotor-${index}`, 0.8, 2.4, [ch('rotation.y', 0, TAU * 3)]));
  }
  return sequences;
}

function airQuadDrone(ctx) {
  const { box, cylinder, mat, part, pedestal, sphere } = ctx;
  pedestal();
  const core = part('core', undefined, 'airframe');
  sphere(core, 0.68, [0, 1.32, 0], mat.primary);
  box(core, [1.25, 0.35, 0.9], [0, 1.24, 0], mat.secondary);
  box(core, [0.48, 0.28, 0.62], [0.55, 1.45, 0], mat.glass);
  for (const z of [-0.38, 0.38]) box(core, [0.12, 0.55, 0.1], [-0.38, 0.66, z], mat.dark, [0, 0, -0.25]);
  const sequences = [seq('core-rise', 'core', 0, 1.1, [ch('position.y', -0.45, 0)])];
  const armData = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  armData.forEach(([x, z], index) => {
    const arm = part(`arm-${index}`, core, 'arm', [x, 0.4, z]);
    arm.rotation.y = Math.atan2(z, x);
    box(arm, [1.75, 0.12, 0.16], [0.8, 1.36, 0], mat.primary);
    const rotor = part(`rotor-${index}`, arm, 'propulsion', [x, 0.5, z]);
    rotor.position.set(1.65, 1.42, 0);
    cylinder(rotor, 0.22, 0.22, 0.13, [0, 0, 0], mat.accent);
    box(rotor, [1.55, 0.04, 0.11], [0, 0.12, 0], mat.dark);
    sequences.push(seq(`arm-open-${index}`, `arm-${index}`, 0.15 + index * 0.08, 1.2, [ch('scale.x', 0.12, 1)]));
    sequences.push(seq(`rotor-${index}`, `rotor-${index}`, 1.25, 2, [ch('rotation.y', 0, TAU * 3)]));
  });
  return sequences;
}

function robotRover(ctx) {
  const { box, cylinder, mat, part, pedestal, sphere, wheel } = ctx;
  pedestal();
  const base = part('base', undefined, 'mobility');
  box(base, [2.5, 0.42, 1.4], [0, 0.65, 0], mat.secondary);
  box(base, [0.55, 0.2, 0.88], [1.05, 0.88, 0], mat.glass, [0, 0, -0.12]);
  for (const z of [-0.5, 0.5]) box(base, [0.12, 0.13, 0.18], [1.34, 0.7, z], mat.accent);
  for (const x of [-0.8, 0.8]) for (const z of [-0.75, 0.75]) wheel(base, [x, 0.42, z], 0.36, 0.23);
  const mast = part('mast', base, 'sensor', [0, 0.7, 0]);
  cylinder(mast, 0.13, 0.18, 1.35, [0, 1.32, 0], mat.primary);
  const head = part('head', mast, 'sensor', [0, 0.6, 0]);
  box(head, [0.95, 0.42, 0.55], [0, 2.04, 0], mat.primary);
  cylinder(head, 0.12, 0.12, 0.58, [0.58, 2.04, 0], mat.accent, [0, 0, Math.PI / 2]);
  for (const z of [-0.18, 0.18]) sphere(head, 0.09, [0.5, 2.05, z], mat.glass);
  return [
    seq('mast-rise', 'mast', 0, 1.35, [ch('position.y', -0.75, 0)]),
    seq('head-scan', 'head', 1.0, 2.2, [ch('rotation.y', -1.1, 1.1)]),
  ];
}

function robotArm(ctx) {
  const { box, cylinder, mat, part, pedestal } = ctx;
  pedestal();
  const base = part('base', undefined, 'joint');
  cylinder(base, 0.72, 0.9, 0.36, [0, 0.36, 0], mat.secondary, undefined, 24);
  const shoulder = part('shoulder', base, 'joint', [0, 0.8, 0]);
  cylinder(shoulder, 0.38, 0.38, 0.65, [0, 0.82, 0], mat.primary, [Math.PI / 2, 0, 0]);
  box(shoulder, [0.38, 1.9, 0.42], [0, 1.72, 0], mat.primary);
  box(shoulder, [0.12, 1.2, 0.5], [0.22, 1.72, 0], mat.accent);
  const elbow = part('elbow', shoulder, 'joint', [0, 1.1, 0]);
  cylinder(elbow, 0.3, 0.3, 0.56, [0, 2.72, 0], mat.accent, [Math.PI / 2, 0, 0]);
  box(elbow, [0.34, 1.55, 0.36], [0.65, 3.2, 0], mat.primary, [0, 0, -0.82]);
  const wrist = part('wrist', elbow, 'tool', [0.8, 0.8, 0]);
  box(wrist, [0.65, 0.32, 0.55], [1.25, 3.75, 0], mat.secondary);
  box(wrist, [0.12, 0.52, 0.14], [1.62, 3.75, 0.23], mat.accent);
  box(wrist, [0.12, 0.52, 0.14], [1.62, 3.75, -0.23], mat.accent);
  return [
    seq('base-turn', 'base', 0, 2.6, [ch('rotation.y', -0.65, 0.7)]),
    seq('shoulder-lift', 'shoulder', 0.2, 1.6, [ch('rotation.z', 0.48, -0.28)]),
    seq('elbow-fold', 'elbow', 0.72, 1.55, [ch('rotation.z', -0.75, 0.36)]),
    seq('wrist-align', 'wrist', 1.45, 1.2, [ch('rotation.x', -0.7, 0.7)]),
  ];
}

function robotWalker(ctx) {
  const { box, cylinder, mat, part, pedestal, sphere } = ctx;
  pedestal();
  const torso = part('torso', undefined, 'body');
  box(torso, [1.45, 1.25, 0.9], [0, 2.55, 0], mat.primary);
  sphere(torso, 0.42, [0.2, 3.42, 0], mat.secondary);
  cylinder(torso, 0.09, 0.09, 0.62, [0.65, 3.42, 0], mat.accent, [0, 0, Math.PI / 2]);
  box(torso, [0.18, 0.38, 0.62], [0.73, 2.7, 0], mat.glass);
  for (const z of [-0.7, 0.7]) {
    cylinder(torso, 0.28, 0.34, 0.42, [0, 2.82, z], mat.secondary, [Math.PI / 2, 0, 0]);
    box(torso, [0.28, 1.15, 0.3], [0, 2.0, z], mat.primary, [0, 0, z > 0 ? -0.16 : 0.16]);
  }
  const sequences = [seq('torso-rise', 'torso', 0, 1.05, [ch('position.y', -1.15, 0)])];
  for (const [index, z] of [-0.58, 0.58].entries()) {
    const leg = part(`leg-${index}`, torso, 'leg', [0, -0.9, z > 0 ? 1 : -1]);
    box(leg, [0.42, 1.42, 0.42], [0, 1.42, z], mat.secondary, [0, 0, index ? 0.12 : -0.12]);
    box(leg, [0.92, 0.25, 0.65], [0.22, 0.55, z], mat.dark);
    sequences.push(seq(`leg-lock-${index}`, `leg-${index}`, 0.25 + index * 0.16, 1.3, [ch('rotation.z', index ? -0.45 : 0.45, index ? 0.08 : -0.08)]));
  }
  sequences.push(seq('sensor-look', 'torso', 1.2, 1.7, [ch('rotation.y', -0.42, 0.42)]));
  return sequences;
}

function industryCrane(ctx) {
  const { box, cylinder, mat, part, pedestal } = ctx;
  pedestal();
  const frame = part('frame', undefined, 'structure');
  box(frame, [0.35, 3.3, 0.35], [-1.75, 1.75, 0], mat.primary);
  box(frame, [0.35, 3.3, 0.35], [1.75, 1.75, 0], mat.primary);
  box(frame, [4.1, 0.38, 0.55], [0, 3.35, 0], mat.primary);
  for (const x of [-1.45, -0.85, -0.25, 0.35, 0.95, 1.55]) box(frame, [0.28, 0.08, 0.6], [x, 3.58, 0], x % 1.2 ? mat.dark : mat.accent, [0, 0, -0.45]);
  const trolley = part('trolley', frame, 'carriage', [1, 0.5, 0]);
  box(trolley, [0.72, 0.42, 0.72], [-1.25, 3.05, 0], mat.secondary);
  const hook = part('hook', trolley, 'tool', [0, -1, 0]);
  cylinder(hook, 0.055, 0.055, 1.55, [-1.25, 2.05, 0], mat.dark);
  box(hook, [0.5, 0.22, 0.5], [-1.25, 1.2, 0], mat.accent);
  return [
    seq('trolley-travel', 'trolley', 0, 2.5, [ch('position.x', 0, 2.5)]),
    seq('hook-lower', 'hook', 0.65, 1.35, [ch('position.y', 0.75, -0.35)]),
    seq('hook-lift', 'hook', 2.05, 1.0, [ch('position.y', -0.35, 0.45)]),
  ];
}

function industryDrill(ctx) {
  const { box, cylinder, mat, part, pedestal } = ctx;
  pedestal();
  const frame = part('frame', undefined, 'structure');
  box(frame, [2.55, 0.35, 1.55], [0, 0.42, 0], mat.secondary);
  box(frame, [0.35, 3.2, 0.35], [-0.9, 1.95, 0], mat.primary);
  box(frame, [1.8, 0.3, 0.45], [-0.05, 3.45, 0], mat.primary);
  box(frame, [0.55, 0.72, 0.18], [-0.78, 2.55, 0.28], mat.secondary);
  box(frame, [0.3, 0.34, 0.06], [-0.77, 2.64, 0.39], mat.glass);
  const carriage = part('carriage', frame, 'carriage', [0, 0.8, 0]);
  box(carriage, [0.78, 0.58, 0.72], [0.65, 2.92, 0], mat.primary);
  const spindle = part('spindle', carriage, 'tool', [0, -0.8, 0]);
  cylinder(spindle, 0.18, 0.18, 1.7, [0.65, 1.82, 0], mat.secondary);
  cylinder(spindle, 0.05, 0.18, 0.65, [0.65, 0.65, 0], mat.accent, undefined, 14);
  return [
    seq('carriage-lower', 'carriage', 0, 1.6, [ch('position.y', 0.35, -0.65)]),
    seq('spindle-spin', 'spindle', 0.3, 2.7, [ch('rotation.y', 0, TAU * 4)]),
    seq('spindle-feed', 'spindle', 1.1, 1.35, [ch('position.y', 0.35, -0.35)]),
  ];
}

function industryConveyor(ctx) {
  const { box, cylinder, mat, part, pedestal } = ctx;
  pedestal();
  const frame = part('frame', undefined, 'structure');
  box(frame, [3.8, 0.22, 1.25], [0, 0.75, 0], mat.dark);
  box(frame, [3.9, 0.38, 0.14], [0, 0.68, -0.7], mat.primary);
  box(frame, [3.9, 0.38, 0.14], [0, 0.68, 0.7], mat.primary);
  for (const x of [-1.5, 1.5]) {
    box(frame, [0.14, 1.0, 0.14], [x, 0.52, -0.7], mat.secondary);
    box(frame, [0.14, 1.0, 0.14], [x, 0.52, 0.7], mat.secondary);
  }
  for (const x of [-1.55, -0.75, 0.05, 0.85, 1.65]) cylinder(frame, 0.12, 0.12, 1.22, [x, 0.86, 0], mat.secondary, [Math.PI / 2, 0, 0]);
  const sequences = [];
  for (let index = 0; index < 3; index += 1) {
    const cargo = part(`cargo-${index}`, frame, 'payload', [0.5, 0.4, 0]);
    box(cargo, [0.62, 0.62, 0.62], [-1.55, 1.28, 0], index === 1 ? mat.accent : mat.primary);
    sequences.push(seq(`move-${index}`, `cargo-${index}`, index * 0.42, 2.4, [ch('position.x', 0, 3.1)]));
  }
  return sequences;
}

function infraRadar(ctx) {
  const { box, cylinder, mat, part, pedestal } = ctx;
  pedestal();
  const base = part('base', undefined, 'structure');
  cylinder(base, 1.15, 1.35, 0.42, [0, 0.38, 0], mat.secondary, undefined, 28);
  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * TAU;
    box(base, [0.16, 0.16, 0.32], [Math.cos(angle) * 0.9, 0.62, Math.sin(angle) * 0.9], mat.accent, [0, -angle, 0]);
  }
  const mast = part('mast', base, 'support', [0, 0.8, 0]);
  cylinder(mast, 0.22, 0.35, 2.4, [0, 1.58, 0], mat.primary);
  const head = part('head', mast, 'sensor', [0, 0.8, 0]);
  cylinder(head, 0.48, 0.6, 0.32, [0, 2.86, 0], mat.secondary);
  const dish = part('dish', head, 'sensor', [0, 0.8, 0]);
  cylinder(dish, 1.18, 0.12, 0.32, [0, 3.35, 0], mat.primary, [Math.PI / 2, 0, 0], 28);
  cylinder(dish, 0.07, 0.07, 0.78, [0.42, 3.35, 0], mat.accent, [0, 0, Math.PI / 2]);
  return [
    seq('mast-deploy', 'mast', 0, 1.35, [ch('position.y', -1.8, 0)]),
    seq('dish-tilt', 'dish', 0.75, 1.1, [ch('rotation.z', -1.15, -0.18)]),
    seq('head-scan', 'head', 1.35, 2.0, [ch('rotation.y', 0, TAU)]),
  ];
}

function infraShelter(ctx) {
  const { box, mat, part, pedestal } = ctx;
  pedestal();
  const core = part('core', undefined, 'structure');
  box(core, [2.45, 1.4, 1.9], [0, 0.88, 0], mat.secondary);
  box(core, [0.1, 0.58, 0.82], [1.24, 0.92, 0], mat.glass);
  for (const z of [-0.6, 0.6]) box(core, [0.12, 0.18, 0.24], [1.3, 0.5, z], mat.accent);
  const roof = part('roof', core, 'shell', [0, 0.8, 0]);
  box(roof, [2.8, 0.22, 2.2], [0, 1.72, 0], mat.primary);
  const left = part('left-panel', core, 'shell', [-1, 0.5, 0]);
  box(left, [0.18, 1.45, 1.9], [-1.32, 0.82, 0], mat.primary);
  const right = part('right-panel', core, 'shell', [1, 0.5, 0]);
  box(right, [0.18, 1.45, 1.9], [1.32, 0.82, 0], mat.primary);
  return [
    seq('core-rise', 'core', 0, 1.15, [ch('position.y', -1.35, 0)]),
    seq('roof-lock', 'roof', 0.75, 1.15, [ch('position.y', -0.75, 0)]),
    seq('left-open', 'left-panel', 1.3, 1.0, [ch('rotation.z', -1.2, 0)]),
    seq('right-open', 'right-panel', 1.3, 1.0, [ch('rotation.z', 1.2, 0)]),
  ];
}

function infraBridge(ctx) {
  const { box, cylinder, mat, part, pedestal } = ctx;
  pedestal();
  const pier = part('pier', undefined, 'structure');
  cylinder(pier, 0.82, 1.05, 1.05, [0, 0.55, 0], mat.secondary, undefined, 24);
  const left = part('left-deck', pier, 'deck', [-1, 0.5, 0]);
  box(left, [2.6, 0.24, 1.25], [-1.3, 1.08, 0], mat.primary);
  for (const z of [-0.58, 0.58]) box(left, [2.55, 0.18, 0.12], [-1.3, 1.34, z], mat.secondary);
  const right = part('right-deck', pier, 'deck', [1, 0.5, 0]);
  box(right, [2.6, 0.24, 1.25], [1.3, 1.08, 0], mat.primary);
  for (const z of [-0.58, 0.58]) box(right, [2.55, 0.18, 0.12], [1.3, 1.34, z], mat.secondary);
  const beacon = part('beacon', pier, 'signal', [0, 0.7, 0]);
  cylinder(beacon, 0.12, 0.12, 0.8, [0, 1.65, 0], mat.accent);
  return [
    seq('pier-rise', 'pier', 0, 1.0, [ch('position.y', -0.9, 0)]),
    seq('left-deploy', 'left-deck', 0.6, 1.45, [ch('rotation.z', -1.42, 0), ch('position.x', 0.9, 0)]),
    seq('right-deploy', 'right-deck', 0.6, 1.45, [ch('rotation.z', 1.42, 0), ch('position.x', -0.9, 0)]),
    seq('beacon-on', 'beacon', 1.75, 1.2, [ch('scale.y', 0.1, 1)]),
  ];
}

export const FAMILY_CATALOG = [
  {
    id: 'ground', label: '地面载具', code: 'GROUND', thesis: '同一底盘契约承载行驶、武器与工程作业。',
    camera: [10.5, 6.2, 14.5], target: [0, 1.25, 0],
    items: [
      { id: 'assault-tank', label: '突击坦克', capability: '共享底盘 · 炮塔部署 · 索敌与后坐', generatorConfig: TRACKED_VEHICLE_PRESETS.tank },
      { id: 'radar-carrier', label: '履带雷达车', capability: '共享底盘 · 桅杆升起 · 阵面扫描', generatorConfig: TRACKED_VEHICLE_PRESETS.radar },
      { id: 'engineer-carrier', label: '履带工程车', capability: '共享底盘 · 吊臂抬升 · 伸缩作业', generatorConfig: TRACKED_VEHICLE_PRESETS.engineer },
    ],
  },
  {
    id: 'air', label: '飞行器', code: 'AIRCRAFT', thesis: '机体不变，飞行构型由机翼、旋翼与起落机构定义。',
    camera: [11, 6.8, 15], target: [0, 1.5, 0],
    items: [
      { id: 'fixed-wing', label: '固定翼飞机', capability: '折叠翼展开 · 起落架释放', displayScale: 0.9, builder: airFixedWing },
      { id: 'tilt-rotor', label: '倾转旋翼机', capability: '发动机短舱倾转 · 双旋翼启动', displayScale: 0.82, builder: airTiltRotor },
      { id: 'quad-drone', label: '四旋翼无人机', capability: '机臂展开 · 升空 · 旋翼运转', displayScale: 0.9, builder: airQuadDrone },
    ],
  },
  {
    id: 'robot', label: '机器人', code: 'ROBOTICS', thesis: '移动底座、关节链和传感头复用同一部件—动作协议。',
    camera: [10.2, 6.4, 14.2], target: [0, 1.65, 0],
    items: [
      { id: 'inspection-rover', label: '巡检机器人', capability: '传感桅杆升起 · 视觉扫描', builder: robotRover },
      { id: 'industrial-arm', label: '工业机械臂', capability: '底座 · 肩 · 肘 · 腕四级关节', displayScale: 0.86, builder: robotArm },
      { id: 'walker', label: '双足机甲', capability: '机体升起 · 支腿锁定 · 传感转向', displayScale: 0.88, builder: robotWalker },
    ],
  },
  {
    id: 'industry', label: '工业机械', code: 'INDUSTRY', thesis: '把工艺设备拆成结构、执行器、工具与载荷。',
    camera: [10.8, 6.5, 14.8], target: [0, 1.5, 0],
    items: [
      { id: 'gantry-crane', label: '龙门吊', capability: '横移小车 · 吊具升降', displayScale: 0.86, builder: industryCrane },
      { id: 'drill-press', label: '钻削设备', capability: '主轴旋转 · 进给 · 滑台升降', builder: industryDrill },
      { id: 'conveyor', label: '输送线', capability: '多载荷错峰传送', builder: industryConveyor },
    ],
  },
  {
    id: 'infrastructure', label: '基础设施', code: 'INFRA', thesis: '建筑成为可部署、可工作、可反馈状态的对象。',
    camera: [11.5, 7.2, 15.8], target: [0, 1.45, 0],
    items: [
      { id: 'radar-station', label: '雷达站', capability: '桅杆部署 · 天线俯仰与扫描', displayScale: 0.9, builder: infraRadar },
      { id: 'field-shelter', label: '模块方舱', capability: '主体升起 · 顶盖与侧板展开', builder: infraShelter },
      { id: 'deployable-bridge', label: '部署桥梁', capability: '桥墩升起 · 双向桥面展开', builder: infraBridge },
    ],
  },
];

export function createFamilyObject({ THREE, family, item }) {
  if (item.generatorConfig) {
    const rig = createTrackedVehicle({ THREE, config: item.generatorConfig });
    rig.root.userData.family = family.id;
    rig.root.userData.objectId = item.id;
    rig.root.userData.capability = item.capability;
    return rig;
  }
  const definition = { ...item, family: family.id };
  const context = createContext(THREE, definition);
  const sequences = item.builder(context);
  const rig = createRig({
    name: item.label,
    root: context.root,
    parts: context.parts,
    clips: { demo: { name: 'demo', sequences } },
  });
  rig.root.userData.family = family.id;
  rig.root.userData.objectId = item.id;
  rig.root.userData.capability = item.capability;
  return rig;
}

export function catalogSummary() {
  return FAMILY_CATALOG.map((family) => ({
    id: family.id,
    label: family.label,
    items: family.items.map(({ id, label, capability }) => ({ id, label, capability })),
  }));
}
