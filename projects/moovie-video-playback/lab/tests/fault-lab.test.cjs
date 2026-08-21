'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const path = require('node:path');

const faultLab = require(path.resolve(__dirname, '..', 'fault-lab.js'));
const { createFaultLabServer, rewriteAppleHlsManifest } = require(path.resolve(__dirname, '..', 'server', 'fault-lab-server.cjs'));

test('circuit breaker opens, blocks, half-opens and closes after recovery', () => {
  let clock = 1000;
  const breaker = new faultLab.CircuitBreaker({ failureThreshold: 3, coolDownMs: 500, now: () => clock });
  assert.equal(breaker.beginRequest().allowed, true);
  breaker.recordFailure();
  breaker.recordFailure();
  breaker.recordFailure();
  assert.deepEqual(breaker.snapshot(), { state: 'open', failures: 3, threshold: 3, retryAfterMs: 500 });
  assert.equal(breaker.beginRequest().allowed, false);
  clock += 500;
  const probe = breaker.beginRequest();
  assert.equal(probe.allowed, true);
  assert.equal(probe.state, 'half_open');
  assert.equal(breaker.beginRequest().allowed, false, 'only one half-open probe is allowed');
  breaker.recordSuccess();
  assert.deepEqual(breaker.snapshot(), { state: 'closed', failures: 0, threshold: 3, retryAfterMs: 0 });
});

test('playlist parser resolves relative media segments', () => {
  const segments = faultLab.playlistSegments('#EXTM3U\n#EXTINF:2,\nsegment0.ts\n', 'http://127.0.0.1:9999/hls/a/index.m3u8');
  assert.deepEqual(segments, ['http://127.0.0.1:9999/hls/a/segment0.ts']);
});

test('local fake AppleCMS exposes real success and classified failures', async (t) => {
  const server = createFaultLabServer({ timeoutDelayMs: 160 });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  async function probe(mode, timeoutMs = 100) {
    return faultLab.requestAppleCms({
      url: `${baseUrl}/api.php/provide/vod?ac=videolist&wd=test&mode=${mode}`,
      timeoutMs,
      breaker: new faultLab.CircuitBreaker()
    });
  }

  const healthy = await probe('healthy');
  assert.equal(healthy.ok, true);
  assert.equal(healthy.status, 200);
  assert.equal(healthy.itemCount, 1);
  assert.equal((await probe('rate_limit')).kind, 'rate_limited');
  assert.equal((await probe('server_error')).kind, 'http_error');
  assert.equal((await probe('invalid_json')).kind, 'invalid_json');
  assert.equal((await probe('timeout', 30)).kind, 'timeout');
});

test('HLS transport probe distinguishes manifest and segment failure then fails over', async (t) => {
  const server = createFaultLabServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const manifestFailure = await faultLab.probeHlsLine({ manifestUrl: `${baseUrl}/hls/manifest-error/index.m3u8` });
  assert.equal(manifestFailure.kind, 'manifest_error');
  assert.equal(manifestFailure.manifestStatus, 503);

  const segmentFailure = await faultLab.probeHlsLine({ manifestUrl: `${baseUrl}/hls/segment-error/index.m3u8` });
  assert.equal(segmentFailure.kind, 'segment_error');
  assert.equal(segmentFailure.manifestStatus, 200);
  assert.equal(segmentFailure.segmentStatus, 503);

  const failover = await faultLab.probeHlsCandidates({
    manifestUrls: [
      `${baseUrl}/hls/segment-error/index.m3u8`,
      `${baseUrl}/hls/healthy/index.m3u8`
    ]
  });
  assert.equal(failover.ok, true);
  assert.equal(failover.selectedLine, 2);
  assert.equal(failover.attempts.length, 2);
  assert.equal(failover.result.kind, 'transport_success');
  assert.ok(failover.result.segmentBytes > 0);
});

test('decodable HLS routes serve a real playlist and inject a mid-stream segment failure', async (t) => {
  const server = createFaultLabServer({ decodableFailureDelayMs: 0 });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const manifest = await fetch(`${baseUrl}/hls/decodable-healthy/index.m3u8`);
  assert.equal(manifest.status, 200);
  const manifestText = await manifest.text();
  assert.match(manifestText, /#EXTM3U/);
  assert.match(manifestText, /segment002\.ts/);

  const healthySegment = await fetch(`${baseUrl}/hls/decodable-healthy/segment002.ts`);
  assert.equal(healthySegment.status, 200);
  assert.ok((await healthySegment.arrayBuffer()).byteLength > 100000);

  const faultySegment = await fetch(`${baseUrl}/hls/decodable-faulty/segment002.ts`);
  assert.equal(faultySegment.status, 503);
});

test('allowlisted Apple HLS proxy rewrites nested manifests and rejects foreign references', async (t) => {
  const upstreamRequests = [];
  const externalFetch = async (input) => {
    const url = new URL(input);
    upstreamRequests.push(url.href);
    if (url.pathname.endsWith('bipbop_16x9_variant.m3u8')) {
      return new Response('#EXTM3U\n#EXT-X-MEDIA:TYPE=AUDIO,URI="alternate_audio_aac/prog_index.m3u8"\n#EXT-X-STREAM-INF:BANDWIDTH=577610\ngear2/prog_index.m3u8\n', {
        status: 200,
        headers: { 'content-type': 'application/x-mpegURL' }
      });
    }
    if (url.pathname.endsWith('gear2/prog_index.m3u8')) {
      return new Response('#EXTM3U\n#EXTINF:10,\nfileSequence0.ts\n', {
        status: 200,
        headers: { 'content-type': 'application/vnd.apple.mpegurl' }
      });
    }
    return new Response(Buffer.from('APPLE_SAMPLE_SEGMENT'), {
      status: 200,
      headers: { 'content-type': 'video/mp2t' }
    });
  };

  const server = createFaultLabServer({ externalFetch });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const master = await fetch(`${baseUrl}/external-hls/apple-bipbop/bipbop_16x9_variant.m3u8`);
  assert.equal(master.status, 200);
  assert.equal(master.headers.get('x-moovie-lab'), 'allowlisted-external-proxy');
  const masterText = await master.text();
  assert.match(masterText, /URI="\/external-hls\/apple-bipbop\/alternate_audio_aac\/prog_index\.m3u8"/);
  assert.match(masterText, /\/external-hls\/apple-bipbop\/gear2\/prog_index\.m3u8/);

  const media = await fetch(`${baseUrl}/external-hls/apple-bipbop/gear2/prog_index.m3u8`);
  assert.match(await media.text(), /\/external-hls\/apple-bipbop\/gear2\/fileSequence0\.ts/);
  const segment = await fetch(`${baseUrl}/external-hls/apple-bipbop/gear2/fileSequence0.ts`);
  assert.equal(segment.status, 200);
  assert.ok((await segment.arrayBuffer()).byteLength > 0);
  assert.equal(upstreamRequests.length, 3);
  assert.ok(upstreamRequests.every((url) => url.startsWith('https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/')));

  assert.throws(() => rewriteAppleHlsManifest('#EXTM3U\nhttps://evil.example/video.m3u8\n', 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/master.m3u8'), /outside_allowlist/);
  const rejected = await fetch(`${baseUrl}/external-hls/apple-bipbop/%2F%2Fevil.example%2Fvideo.m3u8`);
  assert.equal(rejected.status, 403);
});
