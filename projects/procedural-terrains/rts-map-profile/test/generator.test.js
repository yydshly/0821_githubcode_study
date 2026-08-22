import assert from 'node:assert/strict';
import test from 'node:test';
import { generateRtsMap, sampleMap, serializeRtsMap } from '../src/generator.js';

test('same seed and params produce identical terrain and semantic grids', () => {
  const first = generateRtsMap({ seed: 81173 });
  const second = generateRtsMap({ seed: 81173 });
  assert.deepEqual(first.heights, second.heights);
  assert.deepEqual(first.walkable, second.walkable);
  assert.deepEqual(first.buildable, second.buildable);
});

test('terrain is mirrored across the faction axis', () => {
  const map = generateRtsMap({ seed: 24911 });
  for (let z = 0; z < map.size; z += 1) {
    for (let x = 0; x < Math.floor(map.size / 2); x += 1) {
      const left = map.heights[z * map.size + x];
      const right = map.heights[z * map.size + (map.size - 1 - x)];
      assert.ok(Math.abs(left - right) < 1e-6);
    }
  }
});

test('both faction spawns are walkable and buildable', () => {
  const map = generateRtsMap();
  for (const spawn of map.spawnPoints) {
    const sample = sampleMap(map, spawn.x, spawn.z);
    assert.equal(sample.walkable, true);
    assert.equal(sample.buildable, true);
  }
});

test('strategic profile contains stable routes, mirrored resources and export grids', () => {
  const map = generateRtsMap({ seed: 991 });
  assert.equal(map.routes.length, 2);
  assert.equal(map.objectives.length, 2);
  assert.equal(map.resources.length, 6);
  assert.equal(map.metrics.symmetryScore, 1);
  assert.ok(map.metrics.walkableRatio > 0.2);
  assert.ok(map.metrics.buildableRatio > 0.05);

  const exported = serializeRtsMap(map);
  assert.equal(exported.grid.heights.length, map.size * map.size);
  assert.equal(exported.grid.walkable.length, map.size * map.size);
  assert.equal(exported.coordinateSystem.gameplayPlane, 0);
});

