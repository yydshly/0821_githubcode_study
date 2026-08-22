export const DEFAULT_PROFILE = Object.freeze({
  seed: 48271,
  gridSize: 65,
  worldSize: 960,
  roughness: 0.58,
  waterLevel: 0.2,
  ridgeStrength: 0.62,
  theme: 'temperate',
});

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);

function hash2(seed, x, y) {
  let h = (seed | 0) ^ Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function valueNoise(seed, x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = smooth(x - x0);
  const ty = smooth(y - y0);
  const a = hash2(seed, x0, y0);
  const b = hash2(seed, x0 + 1, y0);
  const c = hash2(seed, x0, y0 + 1);
  const d = hash2(seed, x0 + 1, y0 + 1);
  return lerp(lerp(a, b, tx), lerp(c, d, tx), ty);
}

function fbm(seed, x, y, octaves = 5) {
  let total = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let weight = 0;
  for (let octave = 0; octave < octaves; octave += 1) {
    total += valueNoise(seed + octave * 1013, x * frequency, y * frequency) * amplitude;
    weight += amplitude;
    amplitude *= 0.5;
    frequency *= 2.03;
  }
  return total / weight;
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const lengthSq = abx * abx + aby * aby || 1;
  const t = clamp(((px - ax) * abx + (py - ay) * aby) / lengthSq);
  const dx = px - (ax + abx * t);
  const dy = py - (ay + aby * t);
  return Math.hypot(dx, dy);
}

function pathDistance(x, z, points) {
  let best = Infinity;
  for (let i = 0; i < points.length - 1; i += 1) {
    best = Math.min(best, distanceToSegment(
      x,
      z,
      points[i][0],
      points[i][1],
      points[i + 1][0],
      points[i + 1][1],
    ));
  }
  return best;
}

function radialBlend(x, z, cx, cz, inner, outer) {
  const distance = Math.hypot(x - cx, z - cz);
  return 1 - smooth(clamp((distance - inner) / Math.max(outer - inner, 0.0001)));
}

function gridIndex(size, x, z) {
  return z * size + x;
}

function sampleSlope(heights, size, x, z) {
  const left = heights[gridIndex(size, Math.max(0, x - 1), z)];
  const right = heights[gridIndex(size, Math.min(size - 1, x + 1), z)];
  const down = heights[gridIndex(size, x, Math.max(0, z - 1))];
  const up = heights[gridIndex(size, x, Math.min(size - 1, z + 1))];
  return Math.hypot((right - left) * 0.5, (up - down) * 0.5);
}

function cellAtNormalized(size, x, z) {
  return {
    x: Math.round(clamp((x + 1) * 0.5) * (size - 1)),
    z: Math.round(clamp((z + 1) * 0.5) * (size - 1)),
  };
}

function countTruthy(values) {
  let count = 0;
  for (const value of values) count += value ? 1 : 0;
  return count;
}

export function generateRtsMap(options = {}) {
  const params = { ...DEFAULT_PROFILE, ...options };
  params.seed = Number.isFinite(Number(params.seed)) ? Math.trunc(Number(params.seed)) : DEFAULT_PROFILE.seed;
  params.gridSize = Math.max(33, Math.min(129, Math.trunc(params.gridSize) | 1));
  params.roughness = clamp(Number(params.roughness), 0.1, 1);
  params.waterLevel = clamp(Number(params.waterLevel), 0.08, 0.38);
  params.ridgeStrength = clamp(Number(params.ridgeStrength), 0, 1);

  const size = params.gridSize;
  const heights = new Float32Array(size * size);
  const roadMask = new Uint8Array(size * size);
  const baseMask = new Uint8Array(size * size);
  const walkable = new Uint8Array(size * size);
  const buildable = new Uint8Array(size * size);
  const slopes = new Float32Array(size * size);

  const routes = [
    {
      id: 'route-north',
      points: [[-0.72, 0], [-0.42, -0.14], [-0.2, -0.31], [0.2, -0.31], [0.42, -0.14], [0.72, 0]],
    },
    {
      id: 'route-south',
      points: [[-0.72, 0], [-0.42, 0.14], [-0.2, 0.31], [0.2, 0.31], [0.42, 0.14], [0.72, 0]],
    },
  ];
  const spawnPoints = [
    { id: 'spawn-alpha', faction: 'alpha', x: -0.72, z: 0 },
    { id: 'spawn-bravo', faction: 'bravo', x: 0.72, z: 0 },
  ];

  for (let gz = 0; gz < size; gz += 1) {
    const z = (gz / (size - 1)) * 2 - 1;
    for (let gx = 0; gx < size; gx += 1) {
      const x = (gx / (size - 1)) * 2 - 1;
      const mirroredX = Math.abs(x);
      const macro = fbm(params.seed, mirroredX * 1.35 + 4.2, z * 1.35 - 7.1, 5);
      const detail = fbm(params.seed + 991, mirroredX * 4.7 - 2.4, z * 4.7 + 8.3, 4);
      const basin = 0.07 * (1 - Math.min(1, Math.hypot(x, z) * 0.72));
      const edgeRise = 0.13 * smooth(clamp((Math.max(Math.abs(x), Math.abs(z)) - 0.72) / 0.28));
      const passNorth = Math.exp(-Math.pow((z + 0.31) / 0.12, 2));
      const passSouth = Math.exp(-Math.pow((z - 0.31) / 0.12, 2));
      const passCut = clamp(passNorth + passSouth);
      const centralRidge = Math.exp(-Math.pow(x / 0.17, 2)) * (1 - passCut * 0.92) * 0.28 * params.ridgeStrength;
      let height = 0.27
        + (macro - 0.5) * 0.44 * params.roughness
        + (detail - 0.5) * 0.12 * params.roughness
        + basin
        + edgeRise
        + centralRidge;

      const idx = gridIndex(size, gx, gz);
      const baseBlend = Math.max(
        radialBlend(x, z, -0.72, 0, 0.12, 0.24),
        radialBlend(x, z, 0.72, 0, 0.12, 0.24),
      );
      if (baseBlend > 0.001) {
        height = lerp(height, 0.33, baseBlend * 0.96);
        baseMask[idx] = baseBlend > 0.35 ? 1 : 0;
      }

      let nearestRoute = Infinity;
      for (const route of routes) nearestRoute = Math.min(nearestRoute, pathDistance(x, z, route.points));
      const routeBlend = 1 - smooth(clamp((nearestRoute - 0.035) / 0.085));
      if (routeBlend > 0.001) {
        height = lerp(height, 0.315, routeBlend * 0.9);
        roadMask[idx] = routeBlend > 0.36 ? 1 : 0;
      }

      heights[idx] = clamp(height, 0.035, 0.93);
    }
  }

  let minHeight = Infinity;
  let maxHeight = -Infinity;
  for (let z = 0; z < size; z += 1) {
    for (let x = 0; x < size; x += 1) {
      const idx = gridIndex(size, x, z);
      const slope = sampleSlope(heights, size, x, z);
      slopes[idx] = slope;
      minHeight = Math.min(minHeight, heights[idx]);
      maxHeight = Math.max(maxHeight, heights[idx]);
      const dry = heights[idx] > params.waterLevel + 0.018;
      walkable[idx] = dry && (slope < 0.072 || roadMask[idx] || baseMask[idx]) ? 1 : 0;
      buildable[idx] = dry && (slope < 0.026 || baseMask[idx]) && !roadMask[idx] ? 1 : 0;
    }
  }

  for (const spawn of spawnPoints) {
    const cell = cellAtNormalized(size, spawn.x, spawn.z);
    const idx = gridIndex(size, cell.x, cell.z);
    walkable[idx] = 1;
    buildable[idx] = 1;
  }

  const resources = [
    { id: 'ore-alpha-north', owner: 'alpha', x: -0.53, z: -0.2, value: 1200 },
    { id: 'ore-bravo-north', owner: 'bravo', x: 0.53, z: -0.2, value: 1200 },
    { id: 'ore-alpha-south', owner: 'alpha', x: -0.53, z: 0.2, value: 1200 },
    { id: 'ore-bravo-south', owner: 'bravo', x: 0.53, z: 0.2, value: 1200 },
    { id: 'ore-contested-north', owner: 'neutral', x: 0, z: -0.48, value: 1800 },
    { id: 'ore-contested-south', owner: 'neutral', x: 0, z: 0.48, value: 1800 },
  ];
  const objectives = [
    { id: 'choke-north', type: 'chokepoint', x: 0, z: -0.31 },
    { id: 'choke-south', type: 'chokepoint', x: 0, z: 0.31 },
  ];

  const total = size * size;
  const buildableRatio = countTruthy(buildable) / total;
  const walkableRatio = countTruthy(walkable) / total;

  return {
    schema: 'rts-map-profile/v1',
    params,
    size,
    heights,
    slopes,
    roadMask,
    baseMask,
    walkable,
    buildable,
    spawnPoints,
    resources,
    objectives,
    routes,
    metrics: {
      symmetryScore: 1,
      routeCount: routes.length,
      chokepointCount: objectives.length,
      buildableRatio,
      walkableRatio,
      minHeight,
      maxHeight,
    },
  };
}

export function sampleMap(map, nx, nz) {
  const cell = cellAtNormalized(map.size, nx, nz);
  const idx = gridIndex(map.size, cell.x, cell.z);
  return {
    cell,
    height: map.heights[idx],
    slope: map.slopes[idx],
    walkable: Boolean(map.walkable[idx]),
    buildable: Boolean(map.buildable[idx]),
    road: Boolean(map.roadMask[idx]),
    base: Boolean(map.baseMask[idx]),
  };
}

function roundArray(values, digits = 4) {
  const scale = 10 ** digits;
  return Array.from(values, (value) => Math.round(value * scale) / scale);
}

export function serializeRtsMap(map) {
  return {
    schema: map.schema,
    generatedBy: 'Procedural Terrains research · RTS Map Profile prototype',
    coordinateSystem: {
      normalizedXZ: [-1, 1],
      worldSize: map.params.worldSize,
      gameplayPlane: 0,
    },
    params: map.params,
    grid: {
      size: map.size,
      heights: roundArray(map.heights),
      walkable: Array.from(map.walkable),
      buildable: Array.from(map.buildable),
      road: Array.from(map.roadMask),
      base: Array.from(map.baseMask),
    },
    spawnPoints: map.spawnPoints,
    resources: map.resources,
    objectives: map.objectives,
    routes: map.routes,
    metrics: map.metrics,
  };
}

