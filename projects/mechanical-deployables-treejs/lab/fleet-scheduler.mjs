/**
 * Host-side lifecycle scheduler for many deployable rigs.
 *
 * The upstream contract intentionally manages one rig. This scheduler keeps
 * fleet concerns outside that contract: staggered starts, active-only updates,
 * reset/scrub, and aggregate runtime statistics.
 */
export class FleetScheduler {
  #entries = [];
  #clock = 0;
  #mode = 'active-only';

  register(rig) {
    if (!rig || typeof rig.play !== 'function' || typeof rig.update !== 'function') {
      throw new TypeError('register(rig) expects a deployable contract instance');
    }
    const entry = { rig, scheduledAt: null, scheduledClip: null };
    this.#entries.push(entry);
    return () => {
      const index = this.#entries.indexOf(entry);
      if (index >= 0) this.#entries.splice(index, 1);
    };
  }

  clear() {
    this.#entries.length = 0;
    this.#clock = 0;
  }

  setMode(mode) {
    if (mode !== 'active-only' && mode !== 'all') {
      throw new RangeError(`Unknown update mode: ${mode}`);
    }
    this.#mode = mode;
  }

  play(clip, { stagger = 0 } = {}) {
    this.#clock = 0;
    this.#entries.forEach((entry, index) => {
      entry.rig.stop();
      entry.rig.setTime(clip, 0);
      entry.scheduledAt = index * Math.max(0, stagger);
      entry.scheduledClip = clip;
    });
  }

  setTime(clip, time) {
    this.#clock = Math.max(0, time);
    for (const entry of this.#entries) {
      entry.rig.stop();
      entry.rig.setTime(clip, time);
      entry.scheduledAt = null;
      entry.scheduledClip = null;
    }
  }

  update(dt) {
    const step = Math.max(0, dt);
    this.#clock += step;
    let started = 0;
    let updated = 0;

    for (const entry of this.#entries) {
      if (entry.scheduledAt !== null && this.#clock >= entry.scheduledAt) {
        entry.rig.play(entry.scheduledClip);
        entry.scheduledAt = null;
        entry.scheduledClip = null;
        started += 1;
      }

      if (this.#mode === 'all' || entry.rig.playing()) {
        entry.rig.update(step);
        updated += 1;
      }
    }

    return { ...this.stats(), started, updated };
  }

  stats() {
    let active = 0;
    let pending = 0;
    for (const entry of this.#entries) {
      if (entry.rig.playing()) active += 1;
      if (entry.scheduledAt !== null) pending += 1;
    }
    return {
      rigs: this.#entries.length,
      active,
      pending,
      clock: this.#clock,
      mode: this.#mode,
    };
  }
}

export function createFleetScheduler() {
  return new FleetScheduler();
}
