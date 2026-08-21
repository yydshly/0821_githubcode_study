(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MoovieFaultLab = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function nowMs() {
    return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
  }

  function CircuitBreaker(options) {
    options = options || {};
    this.failureThreshold = options.failureThreshold || 3;
    this.coolDownMs = options.coolDownMs || 5000;
    this.now = options.now || Date.now;
    this.reset();
  }

  CircuitBreaker.prototype.reset = function () {
    this.state = 'closed';
    this.failures = 0;
    this.openedAt = null;
    this.probeInFlight = false;
  };

  CircuitBreaker.prototype.beginRequest = function () {
    if (this.state === 'open') {
      var remaining = this.coolDownMs - (this.now() - this.openedAt);
      if (remaining > 0) return { allowed: false, state: 'open', retryAfterMs: remaining };
      this.state = 'half_open';
    }
    if (this.state === 'half_open') {
      if (this.probeInFlight) return { allowed: false, state: 'half_open', retryAfterMs: 0 };
      this.probeInFlight = true;
    }
    return { allowed: true, state: this.state, retryAfterMs: 0 };
  };

  CircuitBreaker.prototype.recordSuccess = function () {
    this.state = 'closed';
    this.failures = 0;
    this.openedAt = null;
    this.probeInFlight = false;
  };

  CircuitBreaker.prototype.recordFailure = function () {
    this.probeInFlight = false;
    this.failures += 1;
    if (this.state === 'half_open' || this.failures >= this.failureThreshold) {
      this.state = 'open';
      this.openedAt = this.now();
    }
  };

  CircuitBreaker.prototype.snapshot = function () {
    var retryAfterMs = 0;
    if (this.state === 'open') retryAfterMs = Math.max(0, this.coolDownMs - (this.now() - this.openedAt));
    return {
      state: this.state,
      failures: this.failures,
      threshold: this.failureThreshold,
      retryAfterMs: retryAfterMs
    };
  };

  function timeoutSignal(timeoutMs) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, timeoutMs);
    return { signal: controller.signal, clear: function () { clearTimeout(timer); } };
  }

  async function requestAppleCms(options) {
    options = options || {};
    var fetchImpl = options.fetchImpl || fetch;
    var breaker = options.breaker;
    var gate = breaker ? breaker.beginRequest() : { allowed: true, state: 'closed', retryAfterMs: 0 };
    if (!gate.allowed) {
      return {
        ok: false,
        kind: 'circuit_open',
        status: null,
        durationMs: 0,
        circuitStateAtStart: gate.state,
        retryAfterMs: Math.ceil(gate.retryAfterMs)
      };
    }

    var timer = timeoutSignal(options.timeoutMs || 1200);
    var startedAt = nowMs();
    var result;
    try {
      var response = await fetchImpl(options.url, { signal: timer.signal, cache: 'no-store' });
      var durationMs = Math.round(nowMs() - startedAt);
      if (!response.ok) {
        result = {
          ok: false,
          kind: response.status === 429 ? 'rate_limited' : 'http_error',
          status: response.status,
          durationMs: durationMs,
          circuitStateAtStart: gate.state
        };
      } else {
        try {
          var payload = await response.json();
          if (!payload || !Array.isArray(payload.list)) throw new Error('missing_list');
          result = {
            ok: true,
            kind: 'success',
            status: response.status,
            durationMs: durationMs,
            itemCount: payload.list.length,
            payload: payload,
            circuitStateAtStart: gate.state
          };
        } catch (error) {
          result = {
            ok: false,
            kind: 'invalid_json',
            status: response.status,
            durationMs: durationMs,
            circuitStateAtStart: gate.state
          };
        }
      }
    } catch (error) {
      result = {
        ok: false,
        kind: error && error.name === 'AbortError' ? 'timeout' : 'network_error',
        status: null,
        durationMs: Math.round(nowMs() - startedAt),
        circuitStateAtStart: gate.state
      };
    } finally {
      timer.clear();
    }

    if (breaker) {
      if (result.ok) breaker.recordSuccess();
      else breaker.recordFailure();
      result.circuit = breaker.snapshot();
    }
    return result;
  }

  function playlistSegments(text, manifestUrl) {
    return String(text || '').split(/\r?\n/)
      .map(function (line) { return line.trim(); })
      .filter(function (line) { return line && line.charAt(0) !== '#'; })
      .map(function (line) { return new URL(line, manifestUrl).href; });
  }

  async function probeHlsLine(options) {
    options = options || {};
    var fetchImpl = options.fetchImpl || fetch;
    var timer = timeoutSignal(options.timeoutMs || 1200);
    var startedAt = nowMs();
    try {
      var manifestResponse = await fetchImpl(options.manifestUrl, { signal: timer.signal, cache: 'no-store' });
      if (!manifestResponse.ok) {
        return { ok: false, kind: 'manifest_error', manifestStatus: manifestResponse.status, durationMs: Math.round(nowMs() - startedAt) };
      }
      var manifest = await manifestResponse.text();
      if (!/^#EXTM3U/m.test(manifest)) {
        return { ok: false, kind: 'invalid_manifest', manifestStatus: manifestResponse.status, durationMs: Math.round(nowMs() - startedAt) };
      }
      var segments = playlistSegments(manifest, options.manifestUrl);
      if (!segments.length) {
        return { ok: false, kind: 'no_segments', manifestStatus: manifestResponse.status, durationMs: Math.round(nowMs() - startedAt) };
      }
      var segmentResponse = await fetchImpl(segments[0], { signal: timer.signal, cache: 'no-store' });
      if (!segmentResponse.ok) {
        return {
          ok: false,
          kind: 'segment_error',
          manifestStatus: manifestResponse.status,
          segmentStatus: segmentResponse.status,
          segmentUrl: segments[0],
          durationMs: Math.round(nowMs() - startedAt)
        };
      }
      var bytes = (await segmentResponse.arrayBuffer()).byteLength;
      return {
        ok: true,
        kind: 'transport_success',
        manifestStatus: manifestResponse.status,
        segmentStatus: segmentResponse.status,
        segmentUrl: segments[0],
        segmentBytes: bytes,
        durationMs: Math.round(nowMs() - startedAt)
      };
    } catch (error) {
      return {
        ok: false,
        kind: error && error.name === 'AbortError' ? 'timeout' : 'network_error',
        durationMs: Math.round(nowMs() - startedAt)
      };
    } finally {
      timer.clear();
    }
  }

  async function probeHlsCandidates(options) {
    options = options || {};
    var attempts = [];
    for (var index = 0; index < options.manifestUrls.length; index += 1) {
      var result = await probeHlsLine({
        manifestUrl: options.manifestUrls[index],
        timeoutMs: options.timeoutMs,
        fetchImpl: options.fetchImpl
      });
      attempts.push({ line: index + 1, url: options.manifestUrls[index], result: result });
      if (result.ok) return { ok: true, selectedLine: index + 1, result: result, attempts: attempts };
    }
    return { ok: false, selectedLine: null, result: attempts[attempts.length - 1].result, attempts: attempts };
  }

  return {
    CircuitBreaker: CircuitBreaker,
    requestAppleCms: requestAppleCms,
    playlistSegments: playlistSegments,
    probeHlsLine: probeHlsLine,
    probeHlsCandidates: probeHlsCandidates
  };
});
