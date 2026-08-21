'use strict';

const PUBLIC_PROVIDER_IDS = ['internet_archive', 'wikimedia', 'loc', 'nasa'];
const SEARCH_LIMIT = 6;
const REQUEST_TIMEOUT_MS = 15000;
const USER_AGENT = 'MoovieResearchLab/1.0 (local research prototype)';

function cleanText(value, maxLength = 360) {
  const input = Array.isArray(value) ? value.join(' ') : String(value || '');
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function first(value) {
  return Array.isArray(value) ? value[0] : value;
}

function field(meta, key) {
  return cleanText(meta && meta[key] && meta[key].value, 500);
}

function normalizeQuery(value) {
  const query = cleanText(value, 80);
  if (query.length < 2) throw Object.assign(new Error('query_too_short'), { statusCode: 400 });
  return query;
}

function licenseDecision(name, url) {
  const label = cleanText(name, 100);
  const href = String(url || '').trim();
  const haystack = `${label} ${href}`.toLowerCase();
  if (/creativecommons\.org\/(publicdomain|public-domain)|public domain|cc0/.test(haystack)) {
    return { allowed: true, name: label || 'Public domain / CC0', url: href, level: 'open' };
  }
  if (/creativecommons\.org\/licenses\/(by|by-sa)\//.test(haystack) || /^cc by(?:-sa)?(?: \d+(?:\.\d+)?)?$/i.test(label)) {
    return { allowed: true, name: label || 'Creative Commons', url: href, level: 'open_with_attribution' };
  }
  return { allowed: false, name: label || '未识别授权', url: href, level: 'review' };
}

async function fetchJson(url, fetchImpl, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' }
    });
    if (!response.ok) throw Object.assign(new Error(`upstream_${response.status}`), { statusCode: 502 });
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function chooseInternetArchiveVideo(files, identifier) {
  const candidates = (Array.isArray(files) ? files : []).filter((file) => {
    const name = String(file.name || '');
    const format = String(file.format || '').toLowerCase();
    return /\.mp4$/i.test(name) && !/(sample|trailer)/i.test(name) && /(h\.264|mpeg4|mpeg-4|512kb)/.test(format);
  });
  candidates.sort((a, b) => {
    const aPreferred = /512kb/i.test(String(a.name)) ? 0 : 1;
    const bPreferred = /512kb/i.test(String(b.name)) ? 0 : 1;
    return aPreferred - bPreferred || Number(a.size || Number.MAX_SAFE_INTEGER) - Number(b.size || Number.MAX_SAFE_INTEGER);
  });
  const selected = candidates[0];
  if (!selected) return null;
  return `https://archive.org/download/${encodeURIComponent(identifier)}/${encodeURIComponent(selected.name).replace(/%2F/g, '/')}`;
}

async function searchInternetArchive(query, fetchImpl) {
  const lucene = `mediatype:movies AND licenseurl:* AND (title:("${query.replace(/["\\]/g, ' ')}") OR description:("${query.replace(/["\\]/g, ' ')}"))`;
  const params = new URLSearchParams({ q: lucene, rows: '12', page: '1', output: 'json' });
  ['identifier', 'title', 'description', 'licenseurl', 'date', 'year', 'creator'].forEach((name) => params.append('fl[]', name));
  const payload = await fetchJson(`https://archive.org/advancedsearch.php?${params}`, fetchImpl);
  const docs = (payload.response && payload.response.docs || []).slice(0, 12);
  const licensed = docs.map((doc) => ({ doc, license: licenseDecision('', first(doc.licenseurl)) })).filter((item) => item.license.allowed).slice(0, 4);
  const settled = await Promise.allSettled(licensed.map(async ({ doc, license }) => {
    const identifier = cleanText(doc.identifier, 120);
    const metadata = await fetchJson(`https://archive.org/metadata/${encodeURIComponent(identifier)}`, fetchImpl);
    const mediaUrl = chooseInternetArchiveVideo(metadata.files, identifier);
    return {
      provider: 'internet_archive',
      id: identifier,
      title: cleanText(doc.title, 140) || identifier,
      year: cleanText(first(doc.year) || first(doc.date), 12).slice(0, 4),
      creator: cleanText(doc.creator, 120),
      description: cleanText(doc.description),
      thumbnail: `https://archive.org/services/img/${encodeURIComponent(identifier)}`,
      sourcePage: `https://archive.org/details/${encodeURIComponent(identifier)}`,
      mediaUrl,
      mimeType: mediaUrl ? 'video/mp4' : '',
      playable: Boolean(mediaUrl),
      licenseName: license.name,
      licenseUrl: license.url,
      rightsStatus: license.level,
      attribution: cleanText(doc.creator, 160) || '见 Internet Archive 项目页',
      reason: mediaUrl ? '' : '授权符合，但没有浏览器可播放的 MP4 衍生文件'
    };
  }));
  const results = settled.filter((entry) => entry.status === 'fulfilled').map((entry) => entry.value);
  const canonicalIdentifiers = /big\s+buck\s+bunny/i.test(query)
    ? ['BigBuckBunny_328']
    : (/^sintel$/i.test(query) ? ['Sintel'] : (/elephants?\s+dream/i.test(query) ? ['ElephantsDream'] : []));
  for (const identifier of canonicalIdentifiers) {
    if (results.some((item) => item.id === identifier)) continue;
    try {
      const metadata = await fetchJson(`https://archive.org/metadata/${identifier}`, fetchImpl);
      const doc = metadata.metadata || {};
      const license = licenseDecision('', first(doc.licenseurl));
      const mediaUrl = license.allowed ? chooseInternetArchiveVideo(metadata.files, identifier) : null;
      if (!license.allowed) continue;
      results.unshift({
        provider: 'internet_archive', id: identifier, title: cleanText(doc.title, 140) || identifier,
        year: cleanText(first(doc.year) || first(doc.date), 12).slice(0, 4), creator: cleanText(doc.creator, 120), description: cleanText(doc.description),
        thumbnail: `https://archive.org/services/img/${identifier}`, sourcePage: `https://archive.org/details/${identifier}`,
        mediaUrl, mimeType: mediaUrl ? 'video/mp4' : '', playable: Boolean(mediaUrl), licenseName: license.name,
        licenseUrl: license.url, rightsStatus: license.level, attribution: cleanText(doc.creator, 160) || '见 Internet Archive 项目页',
        reason: mediaUrl ? '' : '授权符合，但没有浏览器可播放的 MP4 衍生文件'
      });
    } catch (_error) {
      // Keep the ordinary search results; a canonical live-metadata fallback is best effort.
    }
  }
  return results.slice(0, SEARCH_LIMIT);
}

async function searchWikimedia(query, fetchImpl) {
  const params = new URLSearchParams({
    action: 'query', generator: 'search', gsrsearch: `${query} filetype:video`, gsrnamespace: '6', gsrlimit: '12',
    prop: 'imageinfo', iiprop: 'url|mime|extmetadata', iiurlwidth: '640', format: 'json', origin: '*'
  });
  const payload = await fetchJson(`https://commons.wikimedia.org/w/api.php?${params}`, fetchImpl);
  const pages = Object.values(payload.query && payload.query.pages || {}).sort((a, b) => Number(a.index || 0) - Number(b.index || 0));
  return pages.map((page) => {
    const info = page.imageinfo && page.imageinfo[0] || {};
    const meta = info.extmetadata || {};
    const license = licenseDecision(field(meta, 'LicenseShortName'), field(meta, 'LicenseUrl'));
    const mime = String(info.mime || '');
    const playableMime = mime === 'video/webm' || mime === 'video/ogg';
    return {
      provider: 'wikimedia', id: String(page.pageid), title: field(meta, 'ObjectName') || cleanText(page.title.replace(/^File:/, ''), 140),
      year: field(meta, 'DateTimeOriginal').slice(0, 4), creator: field(meta, 'Artist'), description: field(meta, 'ImageDescription'),
      thumbnail: info.thumburl || '', sourcePage: info.descriptionurl || '', mediaUrl: license.allowed && playableMime ? info.url : null,
      mimeType: mime, playable: Boolean(license.allowed && playableMime && info.url), licenseName: license.name, licenseUrl: license.url,
      rightsStatus: license.allowed ? license.level : 'review', attribution: field(meta, 'Attribution') || field(meta, 'Artist'),
      reason: !license.allowed ? '许可字段未通过开放许可白名单' : (!playableMime ? `浏览器播放格式未纳入：${mime || 'unknown'}` : '')
    };
  }).filter((item) => item.playable).slice(0, SEARCH_LIMIT);
}

function locRightsDecision(value) {
  const text = cleanText(value, 500);
  const allowed = /no known restrictions|public domain|free to use|not known to be under copyright/i.test(text);
  return { allowed, text: text || '未返回逐条权利声明，必须人工查看项目页' };
}

async function searchLoc(query, fetchImpl) {
  const params = new URLSearchParams({ q: query, fo: 'json', c: String(SEARCH_LIMIT) });
  const payload = await fetchJson(`https://www.loc.gov/film-and-videos/?${params}`, fetchImpl);
  return (payload.results || []).slice(0, SEARCH_LIMIT).map((item) => {
    const resource = (item.resources || []).find((candidate) => candidate.video || candidate.video_stream) || {};
    const rights = locRightsDecision(item.rights || item.rights_advisory || item.copyright);
    return {
      provider: 'loc', id: cleanText(item.id, 180), title: cleanText(item.title, 140), year: cleanText(item.date, 12).slice(0, 4),
      creator: cleanText(item.contributor || item.creator, 120), description: cleanText(item.description), thumbnail: resource.image || resource.poster || '',
      sourcePage: String(item.id || '').replace(/^http:/, 'https:'), mediaUrl: rights.allowed ? (resource.video || resource.video_stream || null) : null,
      mimeType: resource.video ? 'video/mp4' : 'application/vnd.apple.mpegurl', playable: Boolean(rights.allowed && (resource.video || resource.video_stream)),
      licenseName: rights.allowed ? '项目页声明可用' : '逐条核权', licenseUrl: String(item.id || '').replace(/^http:/, 'https:'),
      rightsStatus: rights.allowed ? 'open' : 'review', attribution: 'Library of Congress', reason: rights.allowed ? '' : rights.text
    };
  });
}

function chooseNasaVideo(assetPayload) {
  const links = assetPayload.collection && assetPayload.collection.items || [];
  const mp4s = links.map((item) => String(item.href || '')).filter((href) => /\.mp4(?:$|\?)/i.test(href));
  mp4s.sort((a, b) => {
    const rank = (url) => /~small|~mobile/i.test(url) ? 0 : (/~medium/i.test(url) ? 1 : (/~large/i.test(url) ? 2 : 3));
    return rank(a) - rank(b);
  });
  return mp4s[0] || null;
}

async function searchNasa(query, fetchImpl) {
  const params = new URLSearchParams({ q: query, media_type: 'video', page_size: String(SEARCH_LIMIT) });
  const payload = await fetchJson(`https://images-api.nasa.gov/search?${params}`, fetchImpl);
  const items = (payload.collection && payload.collection.items || []).slice(0, SEARCH_LIMIT);
  const settled = await Promise.allSettled(items.map(async (item) => {
    const data = item.data && item.data[0] || {};
    const nasaId = cleanText(data.nasa_id, 180);
    const asset = await fetchJson(`https://images-api.nasa.gov/asset/${encodeURIComponent(nasaId)}`, fetchImpl);
    const mediaUrl = chooseNasaVideo(asset);
    const preview = (item.links || []).find((link) => link.rel === 'preview' || link.render === 'image');
    return {
      provider: 'nasa', id: nasaId, title: cleanText(data.title, 140), year: cleanText(data.date_created, 12).slice(0, 4),
      creator: cleanText(data.photographer || data.center || 'NASA', 120), description: cleanText(data.description), thumbnail: preview && preview.href || '',
      sourcePage: `https://images.nasa.gov/details/${encodeURIComponent(nasaId)}`, mediaUrl, mimeType: mediaUrl ? 'video/mp4' : '', playable: Boolean(mediaUrl),
      licenseName: 'NASA 媒体使用指南（有条件）', licenseUrl: 'https://www.nasa.gov/nasa-brand-center/images-and-media/', rightsStatus: 'conditional',
      attribution: 'NASA', reason: mediaUrl ? '限教育/信息与事实性展示；不得暗示背书，第三方素材、标识和人物权利需另审' : '未找到 MP4 资产'
    };
  }));
  return settled.filter((entry) => entry.status === 'fulfilled').map((entry) => entry.value);
}

const PROVIDERS = {
  internet_archive: searchInternetArchive,
  wikimedia: searchWikimedia,
  loc: searchLoc,
  nasa: searchNasa
};

async function searchPublicCatalog(rawQuery, rawProvider, fetchImpl = fetch) {
  const query = normalizeQuery(rawQuery);
  const requested = rawProvider === 'all' || !rawProvider ? PUBLIC_PROVIDER_IDS : [String(rawProvider)];
  if (requested.some((id) => !PUBLIC_PROVIDER_IDS.includes(id))) throw Object.assign(new Error('unknown_provider'), { statusCode: 400 });
  const settled = await Promise.all(requested.map(async (provider) => {
    try {
      return { provider, ok: true, results: await PROVIDERS[provider](query, fetchImpl) };
    } catch (error) {
      return { provider, ok: false, results: [], error: error && error.name === 'AbortError' ? 'timeout' : cleanText(error.message, 100) };
    }
  }));
  return {
    query,
    providers: settled.map(({ provider, ok, error, results }) => ({ provider, ok, error: error || '', count: results.length })),
    results: settled.flatMap((entry) => entry.results)
  };
}

module.exports = {
  PUBLIC_PROVIDER_IDS,
  cleanText,
  licenseDecision,
  chooseInternetArchiveVideo,
  chooseNasaVideo,
  searchPublicCatalog
};
