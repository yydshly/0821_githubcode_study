'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { once } = require('node:events');

const catalog = require(path.resolve(__dirname, '..', 'server', 'public-catalog.cjs'));
const { createFaultLabServer } = require(path.resolve(__dirname, '..', 'server', 'fault-lab-server.cjs'));

test('license gate only auto-allows public domain, CC0, CC BY and CC BY-SA', () => {
  assert.equal(catalog.licenseDecision('CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/').allowed, true);
  assert.equal(catalog.licenseDecision('CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/').allowed, true);
  assert.equal(catalog.licenseDecision('CC0', 'https://creativecommons.org/publicdomain/zero/1.0/').allowed, true);
  assert.equal(catalog.licenseDecision('CC BY-NC 4.0', 'https://creativecommons.org/licenses/by-nc/4.0/').allowed, false);
  assert.equal(catalog.licenseDecision('All rights reserved', '').allowed, false);
});

test('Internet Archive media selector prefers the smaller browser-compatible MP4 derivative', () => {
  const selected = catalog.chooseInternetArchiveVideo([
    { name: 'movie.mp4', format: 'h.264', size: '90000000' },
    { name: 'movie_512kb.mp4', format: '512Kb MPEG4', size: '12000000' },
    { name: 'trailer_512kb.mp4', format: '512Kb MPEG4', size: '1000000' },
    { name: 'movie.ogv', format: 'Ogg Video', size: '3000000' }
  ], 'open-film');
  assert.equal(selected, 'https://archive.org/download/open-film/movie_512kb.mp4');
});

test('Wikimedia adapter exposes an explicitly licensed WebM and rejects non-open metadata', async () => {
  const externalFetch = async (input) => {
    assert.match(String(input), /^https:\/\/commons\.wikimedia\.org\/w\/api\.php/);
    return new Response(JSON.stringify({
      query: { pages: {
        1: { pageid: 1, index: 1, title: 'File:Open Film.webm', imageinfo: [{
          url: 'https://upload.wikimedia.org/open.webm', descriptionurl: 'https://commons.wikimedia.org/wiki/File:Open_Film.webm',
          thumburl: 'https://upload.wikimedia.org/thumb.jpg', mime: 'video/webm', extmetadata: {
            ObjectName: { value: 'Open Film' }, Artist: { value: 'Example Studio' }, LicenseShortName: { value: 'CC BY 4.0' },
            LicenseUrl: { value: 'https://creativecommons.org/licenses/by/4.0/' }, Attribution: { value: 'Example Studio' }
          }
        }] },
        2: { pageid: 2, index: 2, title: 'File:Locked.webm', imageinfo: [{
          url: 'https://upload.wikimedia.org/locked.webm', mime: 'video/webm', extmetadata: { LicenseShortName: { value: 'All rights reserved' } }
        }] }
      } }
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const payload = await catalog.searchPublicCatalog('open film', 'wikimedia', externalFetch);
  assert.equal(payload.providers[0].ok, true);
  assert.equal(payload.results.length, 1);
  assert.equal(payload.results[0].playable, true);
  assert.equal(payload.results[0].mediaUrl, 'https://upload.wikimedia.org/open.webm');
});

test('NASA adapter keeps conditional-use guidance and resolves an MP4 manifest', async () => {
  const externalFetch = async (input) => {
    const url = String(input);
    if (url.startsWith('https://images-api.nasa.gov/search')) {
      return new Response(JSON.stringify({ collection: { items: [{
        data: [{ nasa_id: 'NASA-DEMO', title: 'NASA Demo', media_type: 'video', photographer: 'NASA', date_created: '1969-07-20' }],
        links: [{ rel: 'preview', href: 'https://images-assets.nasa.gov/demo.jpg' }]
      }] } }), { status: 200 });
    }
    if (url === 'https://images-api.nasa.gov/asset/NASA-DEMO') {
      return new Response(JSON.stringify({ collection: { items: [
        { href: 'https://images-assets.nasa.gov/demo~orig.mp4' },
        { href: 'https://images-assets.nasa.gov/demo~small.mp4' }
      ] } }), { status: 200 });
    }
    throw new Error('unexpected_url');
  };
  const payload = await catalog.searchPublicCatalog('Apollo 11', 'nasa', externalFetch);
  assert.equal(payload.results[0].playable, true);
  assert.equal(payload.results[0].rightsStatus, 'conditional');
  assert.match(payload.results[0].reason, /不得暗示背书/);
  assert.match(payload.results[0].mediaUrl, /~small\.mp4$/);
});

test('public catalog HTTP route rejects unknown providers and never becomes a generic proxy', async (t) => {
  const server = createFaultLabServer({ externalFetch: async () => { throw new Error('should_not_fetch'); } });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${base}/public-catalog/search?q=test&provider=https%3A%2F%2Fevil.example`);
  assert.equal(response.status, 400);
  assert.equal((await response.json()).msg, 'unknown_provider');
});
