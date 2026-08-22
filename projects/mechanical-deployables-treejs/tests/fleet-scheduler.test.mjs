import assert from 'node:assert/strict';
import { createFleetScheduler } from '../lab/fleet-scheduler.mjs';

function mockRig() {
  let playing = null;
  let time = 0;
  let updates = 0;
  return {
    play(clip) { playing = clip; },
    stop() { playing = null; },
    playing() { return playing; },
    setTime(_clip, nextTime) { time = nextTime; },
    update(dt) { time += dt; updates += 1; },
    inspect: () => ({ playing, time, updates }),
  };
}

const scheduler = createFleetScheduler();
const rigs = [mockRig(), mockRig(), mockRig()];
rigs.forEach((rig) => scheduler.register(rig));

scheduler.play('deploy', { stagger: 0.5 });
let result = scheduler.update(0.1);
assert.equal(result.active, 1);
assert.equal(result.pending, 2);
assert.equal(result.updated, 1);

result = scheduler.update(0.5);
assert.equal(result.active, 2);
assert.equal(result.pending, 1);
assert.equal(result.updated, 2);
assert.equal(rigs[2].inspect().updates, 0);

scheduler.setMode('all');
result = scheduler.update(0.1);
assert.equal(result.updated, 3);
assert.equal(rigs[2].inspect().updates, 1);

scheduler.setTime('deploy', 2.25);
assert.deepEqual(scheduler.stats(), {
  rigs: 3,
  active: 0,
  pending: 0,
  clock: 2.25,
  mode: 'all',
});

console.log('fleet-scheduler: 8 assertions passed');
