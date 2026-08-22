import assert from 'node:assert/strict';
import {
  TRACKED_VEHICLE_PRESETS,
  normalizeTrackedVehicleConfig,
  phaseAtTime,
  validateStateContinuity,
  validateTrackedVehicleConfig,
} from '../showcase/tracked-vehicle-rules.mjs';

const expected = [
  ['tank', 'turret', 6],
  ['radar', 'radar', 5],
  ['engineer', 'engineer', 7],
];

for (const [presetName, payload, wheelCount] of expected) {
  const normalized = normalizeTrackedVehicleConfig(TRACKED_VEHICLE_PRESETS[presetName]);
  const rules = validateTrackedVehicleConfig(normalized);
  const continuity = validateStateContinuity(normalized);
  assert.equal(normalized.payload, payload);
  assert.equal(normalized.wheelCount, wheelCount);
  assert.equal(rules.pass, true);
  assert.equal(rules.checks.length, 5);
  assert.equal(continuity.pass, true);
}

const clamped = normalizeTrackedVehicleConfig({
  payload: 'unknown', chassisLength: 100, chassisWidth: 1, wheelCount: 99, trackWidth: 5,
});
assert.equal(clamped.payload, 'turret');
assert.equal(clamped.chassisLength, 7.4);
assert.equal(clamped.chassisWidth, 2.65);
assert.equal(clamped.wheelCount, 8);
assert.equal(validateTrackedVehicleConfig(clamped).pass, true);

assert.equal(phaseAtTime(0), 'deploy');
assert.equal(phaseAtTime(2), 'work');
assert.equal(phaseAtTime(3.5), 'recover');
assert.equal(phaseAtTime(4.8), 'retract');
assert.equal(phaseAtTime(6), 'complete');

console.log('tracked-vehicle-rules: 25 assertions passed');
