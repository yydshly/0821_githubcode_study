'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { searchPublicCatalog } = require('./public-catalog.cjs');

const mediaRoot = path.resolve(__dirname, '..', 'media', 'hls');
const APPLE_HLS_ORIGIN = 'https://devstreaming-cdn.apple.com';
const APPLE_HLS_ROOT_PATH = '/videos/streaming/examples/bipbop_16x9/';
const APPLE_HLS_PROXY_PREFIX = '/external-hls/apple-bipbop/';

const APPLE_CMS_PAYLOAD = {
  code: 1,
  msg: '数据列表',
  page: 1,
  pagecount: 1,
  limit: 20,
  total: 1,
  list: [{
    vod_id: 41001,
    vod_name: '雾港档案',
    vod_year: '2025',
    vod_remarks: '第3集',
    vod_play_from: 'local_safe_hls',
    vod_play_url: '第3集$http://127.0.0.1:4174/hls/healthy/index.m3u8'
  }]
};

function send(res, status, type, body) {
  res.writeHead(status, {
    'Content-Type': type,
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
    'X-Moovie-Lab': 'local-fixture'
  });
  res.end(body);
}

function sendJson(res, status, payload) {
  send(res, status, 'application/json; charset=utf-8', JSON.stringify(payload));
}

function toAppleProxyPath(reference, upstreamManifestUrl) {
  const remote = new URL(reference, upstreamManifestUrl);
  if (remote.protocol !== 'https:' || remote.hostname !== 'devstreaming-cdn.apple.com' || !remote.pathname.startsWith(APPLE_HLS_ROOT_PATH)) {
    throw new Error('external_hls_reference_outside_allowlist');
  }
  return `${APPLE_HLS_PROXY_PREFIX}${remote.pathname.slice(APPLE_HLS_ROOT_PATH.length)}${remote.search}`;
}

function rewriteAppleHlsManifest(text, upstreamManifestUrl) {
  return String(text).split(/\r?\n/).map((line) => {
    let rewritten = line.replace(/URI="([^"]+)"/g, (match, reference) => `URI="${toAppleProxyPath(reference, upstreamManifestUrl)}"`);
    const trimmed = rewritten.trim();
    if (trimmed && !trimmed.startsWith('#')) rewritten = toAppleProxyPath(trimmed, upstreamManifestUrl);
    return rewritten;
  }).join('\n');
}

async function proxyAppleHls(res, requestUrl, fetchImpl) {
  const relativePath = requestUrl.pathname.slice(APPLE_HLS_PROXY_PREFIX.length);
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(relativePath);
  } catch (error) {
    return sendJson(res, 400, { code: 400, msg: 'invalid_external_hls_path' });
  }
  if (!decodedPath || decodedPath.includes('\\') || decodedPath.split('/').includes('..')) {
    return sendJson(res, 403, { code: 403, msg: 'external_hls_path_rejected' });
  }

  const upstreamUrl = new URL(decodedPath + requestUrl.search, APPLE_HLS_ORIGIN + APPLE_HLS_ROOT_PATH);
  if (upstreamUrl.protocol !== 'https:' || upstreamUrl.hostname !== 'devstreaming-cdn.apple.com' || !upstreamUrl.pathname.startsWith(APPLE_HLS_ROOT_PATH)) {
    return sendJson(res, 403, { code: 403, msg: 'external_hls_origin_rejected' });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let upstream;
  try {
    upstream = await fetchImpl(upstreamUrl, { signal: controller.signal, redirect: 'error' });
  } finally {
    clearTimeout(timer);
  }
  const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
  let body = Buffer.from(await upstream.arrayBuffer());
  if (upstreamUrl.pathname.endsWith('.m3u8') && upstream.ok) {
    body = Buffer.from(rewriteAppleHlsManifest(body.toString('utf8'), upstreamUrl), 'utf8');
  }
  res.writeHead(upstream.status, {
    'Content-Type': contentType,
    'Content-Length': body.length,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'no-store',
    'X-Moovie-Lab': 'allowlisted-external-proxy',
    'X-Moovie-Upstream': 'developer.apple.com-hls-example'
  });
  res.end(body);
}

function createFaultLabServer(options = {}) {
  const timeoutDelayMs = options.timeoutDelayMs || 2200;
  const decodableFailureDelayMs = options.decodableFailureDelayMs == null ? 2800 : options.decodableFailureDelayMs;
  const externalFetch = options.externalFetch || fetch;
  return http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') return send(res, 204, 'text/plain', '');
    const url = new URL(req.url, 'http://127.0.0.1');

    if (url.pathname === '/health') {
      return sendJson(res, 200, { ok: true, service: 'moovie-local-fault-lab', externalRequests: 'apple_hls_plus_public_catalog_apis' });
    }

    if (url.pathname === '/public-catalog/search') {
      try {
        const result = await searchPublicCatalog(url.searchParams.get('q'), url.searchParams.get('provider') || 'all', externalFetch);
        return sendJson(res, 200, result);
      } catch (error) {
        return sendJson(res, error.statusCode || 500, { code: error.statusCode || 500, msg: error.message || 'public_catalog_error' });
      }
    }

    if (url.pathname === '/api.php/provide/vod') {
      const mode = url.searchParams.get('mode') || 'healthy';
      if (mode === 'rate_limit') return sendJson(res, 429, { code: 429, msg: 'local fixture rate limit' });
      if (mode === 'server_error') return sendJson(res, 500, { code: 500, msg: 'local fixture upstream error' });
      if (mode === 'invalid_json') return send(res, 200, 'application/json; charset=utf-8', '{"code":1,"list":[');
      if (mode === 'timeout') {
        const timer = setTimeout(() => {
          if (!res.writableEnded) sendJson(res, 200, APPLE_CMS_PAYLOAD);
        }, timeoutDelayMs);
        req.on('close', () => clearTimeout(timer));
        return;
      }
      return sendJson(res, 200, APPLE_CMS_PAYLOAD);
    }

    if (url.pathname === '/hls/manifest-error/index.m3u8') {
      return send(res, 503, 'application/vnd.apple.mpegurl; charset=utf-8', '# local manifest failure');
    }

    if (url.pathname === '/hls/healthy/index.m3u8' || url.pathname === '/hls/segment-error/index.m3u8') {
      const playlist = '#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:2\n#EXTINF:2.0,\nsegment0.ts\n#EXT-X-ENDLIST\n';
      return send(res, 200, 'application/vnd.apple.mpegurl; charset=utf-8', playlist);
    }

    if (url.pathname === '/hls/segment-error/segment0.ts') {
      return send(res, 503, 'video/mp2t', 'local segment failure');
    }

    if (url.pathname === '/hls/healthy/segment0.ts') {
      const transportFixture = Buffer.from('MOOVIE_LOCAL_HLS_TRANSPORT_FIXTURE_0001');
      return send(res, 200, 'video/mp2t', transportFixture);
    }

    const decodableMatch = url.pathname.match(/^\/hls\/decodable-(healthy|faulty)\/(index\.m3u8|segment\d{3}\.ts)$/);
    if (decodableMatch) {
      const mode = decodableMatch[1];
      const filename = decodableMatch[2];
      if (mode === 'faulty' && filename === 'segment002.ts') {
        const timer = setTimeout(() => {
          if (!res.writableEnded) send(res, 503, 'video/mp2t', 'synthetic mid-playback segment failure');
        }, decodableFailureDelayMs);
        req.on('close', () => clearTimeout(timer));
        return;
      }
      const filePath = path.join(mediaRoot, filename);
      if (!fs.existsSync(filePath)) return sendJson(res, 404, { code: 404, msg: 'generate_hls_fixture_first' });
      const type = filename.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl; charset=utf-8' : 'video/mp2t';
      return send(res, 200, type, fs.readFileSync(filePath));
    }

    if (url.pathname.startsWith(APPLE_HLS_PROXY_PREFIX)) {
      try {
        return await proxyAppleHls(res, url, externalFetch);
      } catch (error) {
        return sendJson(res, error && error.name === 'AbortError' ? 504 : 502, {
          code: error && error.name === 'AbortError' ? 504 : 502,
          msg: error && error.name === 'AbortError' ? 'external_hls_timeout' : 'external_hls_upstream_error'
        });
      }
    }

    return sendJson(res, 404, { code: 404, msg: 'not_found', path: url.pathname });
  });
}

if (require.main === module) {
  const portIndex = process.argv.indexOf('--port');
  const port = portIndex >= 0 ? Number(process.argv[portIndex + 1]) : 4174;
  const server = createFaultLabServer();
  server.listen(port, '127.0.0.1', () => {
    process.stdout.write(`Moovie local fault lab listening on http://127.0.0.1:${port}\n`);
  });
}

module.exports = {
  createFaultLabServer,
  APPLE_CMS_PAYLOAD,
  APPLE_HLS_ORIGIN,
  APPLE_HLS_ROOT_PATH,
  APPLE_HLS_PROXY_PREFIX,
  rewriteAppleHlsManifest
};
