const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round = (value, digits = 3) => Number(value.toFixed(digits));

export const TRACKED_VEHICLE_PRESETS = {
  tank: {
    id: 'assault-tank', label: '突击坦克', payload: 'turret',
    chassisLength: 6.2, chassisWidth: 3.35, wheelCount: 6,
    trackWidth: 0.5, clearance: 0.48, hullHeight: 1.12,
  },
  radar: {
    id: 'radar-carrier', label: '履带雷达车', payload: 'radar',
    chassisLength: 5.75, chassisWidth: 3.15, wheelCount: 5,
    trackWidth: 0.46, clearance: 0.5, hullHeight: 1.02,
  },
  engineer: {
    id: 'engineer-carrier', label: '履带工程车', payload: 'engineer',
    chassisLength: 6.65, chassisWidth: 3.55, wheelCount: 7,
    trackWidth: 0.53, clearance: 0.52, hullHeight: 1.18,
  },
};

export const STATE_GRAPH = [
  { name: 'deploy', from: 'stowed', to: 'active', at: 0, duration: 1.65 },
  { name: 'work', from: 'active', to: 'work', at: 1.65, duration: 1.55 },
  { name: 'recover', from: 'work', to: 'active', at: 3.2, duration: 0.95 },
  { name: 'retract', from: 'active', to: 'stowed', at: 4.15, duration: 1.65 },
];

export function normalizeTrackedVehicleConfig(input = {}) {
  const payload = ['turret', 'radar', 'engineer'].includes(input.payload) ? input.payload : 'turret';
  const chassisLength = round(clamp(Number(input.chassisLength) || 6, 4.8, 7.4));
  const chassisWidth = round(clamp(Number(input.chassisWidth) || 3.2, 2.65, 4));
  const wheelCount = Math.round(clamp(Number(input.wheelCount) || 6, 4, 8));
  const trackWidth = round(clamp(Number(input.trackWidth) || 0.48, 0.34, Math.min(0.68, chassisWidth * 0.22)));
  const clearance = round(clamp(Number(input.clearance) || 0.48, 0.36, 0.72));
  const hullHeight = round(clamp(Number(input.hullHeight) || 1.08, 0.86, 1.42));
  const trackRun = round(chassisLength * 0.82);
  const wheelSpacing = round(trackRun / (wheelCount - 1));
  const wheelRadius = round(clamp(wheelSpacing * 0.39, 0.34, 0.54));
  const hullWidth = round(chassisWidth - trackWidth * 1.72);
  const trackOffset = round(chassisWidth / 2 - trackWidth / 2);
  const socketY = round(clearance + wheelRadius * 1.35 + hullHeight * 0.72);
  return {
    id: input.id || `${payload}-vehicle`,
    label: input.label || `${payload} vehicle`,
    payload,
    chassisLength,
    chassisWidth,
    wheelCount,
    trackWidth,
    clearance,
    hullHeight,
    trackRun,
    wheelSpacing,
    wheelRadius,
    hullWidth,
    trackOffset,
    socketY,
  };
}

export function validateTrackedVehicleConfig(configInput) {
  const config = normalizeTrackedVehicleConfig(configInput);
  const checks = [
    {
      id: 'track-ratio', label: '履带宽度 ≤ 车宽22%',
      pass: config.trackWidth <= config.chassisWidth * 0.22 + 1e-6,
      value: `${config.trackWidth.toFixed(2)} / ${(config.chassisWidth * 0.22).toFixed(2)}m`,
    },
    {
      id: 'wheel-spacing', label: '负重轮间距 ≥ 轮径75%',
      pass: config.wheelSpacing >= config.wheelRadius * 1.5,
      value: `${config.wheelSpacing.toFixed(2)} / ${(config.wheelRadius * 1.5).toFixed(2)}m`,
    },
    {
      id: 'hull-support', label: '车体宽度 ≥ 车宽55%',
      pass: config.hullWidth >= config.chassisWidth * 0.55,
      value: `${config.hullWidth.toFixed(2)} / ${(config.chassisWidth * 0.55).toFixed(2)}m`,
    },
    {
      id: 'socket-support', label: '载荷插槽位于履带支撑域内',
      pass: config.hullWidth / 2 < config.trackOffset + config.trackWidth / 2,
      value: `socket ±${(config.hullWidth * 0.28).toFixed(2)}m`,
    },
    {
      id: 'wheel-count', label: '负重轮数量在4–8范围',
      pass: config.wheelCount >= 4 && config.wheelCount <= 8,
      value: `${config.wheelCount}`,
    },
  ];
  return { pass: checks.every((check) => check.pass), checks, config };
}

const transform = (entries) => Object.fromEntries(entries);

export function createTrackedVehiclePoses(configInput) {
  const config = normalizeTrackedVehicleConfig(configInput);
  const base = {
    stowed: { 'payload-lift': transform([['position.y', -0.5]]) },
    active: { 'payload-lift': transform([['position.y', 0]]) },
    work: { 'payload-lift': transform([['position.y', 0]]) },
  };

  if (config.payload === 'turret') {
    Object.assign(base.stowed, {
      turret: transform([['rotation.y', 0]]),
      barrel: transform([['rotation.z', 0.28], ['position.x', -0.18]]),
      'sensor-mast': transform([['position.y', -0.38]]),
    });
    Object.assign(base.active, {
      turret: transform([['rotation.y', 0]]),
      barrel: transform([['rotation.z', 0], ['position.x', 0]]),
      'sensor-mast': transform([['position.y', 0]]),
    });
    Object.assign(base.work, {
      turret: transform([['rotation.y', 0.7]]),
      barrel: transform([['rotation.z', 0.16], ['position.x', -0.16]]),
      'sensor-mast': transform([['position.y', 0]]),
    });
  }

  if (config.payload === 'radar') {
    Object.assign(base.stowed, {
      'mast-inner': transform([['position.y', -0.82]]),
      'radar-head': transform([['rotation.y', 0]]),
      'radar-panel': transform([['rotation.z', 1.16]]),
    });
    Object.assign(base.active, {
      'mast-inner': transform([['position.y', 0]]),
      'radar-head': transform([['rotation.y', 0]]),
      'radar-panel': transform([['rotation.z', 0.12]]),
    });
    Object.assign(base.work, {
      'mast-inner': transform([['position.y', 0]]),
      'radar-head': transform([['rotation.y', Math.PI * 2]]),
      'radar-panel': transform([['rotation.z', -0.08]]),
    });
  }

  if (config.payload === 'engineer') {
    Object.assign(base.stowed, {
      boom: transform([['rotation.z', 0.78]]),
      extension: transform([['position.x', -0.92]]),
      claw: transform([['rotation.z', -0.85]]),
    });
    Object.assign(base.active, {
      boom: transform([['rotation.z', -0.2]]),
      extension: transform([['position.x', -0.25]]),
      claw: transform([['rotation.z', -0.15]]),
    });
    Object.assign(base.work, {
      boom: transform([['rotation.z', -0.52]]),
      extension: transform([['position.x', 0.18]]),
      claw: transform([['rotation.z', 0.42]]),
    });
  }

  return base;
}

function samePose(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function validateStateContinuity(configInput, graph = STATE_GRAPH) {
  const poses = createTrackedVehiclePoses(configInput);
  const checks = graph.map((edge, index) => {
    const next = graph[(index + 1) % graph.length];
    const exists = Boolean(poses[edge.from] && poses[edge.to]);
    return {
      id: `${edge.name}-to-${next.name}`,
      label: `${edge.name}终点 = ${next.name}起点`,
      pass: exists && edge.to === next.from && samePose(poses[edge.to], poses[next.from]),
      from: edge.to,
      to: next.from,
    };
  });
  return { pass: checks.every((check) => check.pass), checks, graph, poses };
}

export function phaseAtTime(time, graph = STATE_GRAPH) {
  const edge = graph.find((candidate) => time >= candidate.at && time < candidate.at + candidate.duration);
  return edge?.name || (time >= graph.at(-1).at + graph.at(-1).duration ? 'complete' : 'stowed');
}
