'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const bundledModules = process.env.CODEX_BUNDLED_NODE_MODULES;
const { chromium } = bundledModules ? require(path.join(bundledModules, 'playwright')) : require('playwright');
const baseUrl = process.env.MOOVIE_LAB_URL || 'http://127.0.0.1:4173/lab/';
const evidenceDir = path.resolve(__dirname, '..', 'evidence');
fs.mkdirSync(evidenceDir, { recursive: true });

async function search(page, provider, query) {
  await page.locator('#public-provider').selectOption(provider);
  await page.locator('#public-catalog-query').fill(query);
  await page.locator('#public-catalog-search button[type="submit"]').click();
  await page.locator('#public-catalog-status.is-success').waitFor({ timeout: 70000 });
  return {
    providerStatus: await page.locator('#public-provider-status').innerText(),
    cards: await page.locator('.public-result-card').count(),
    status: await page.locator('#public-catalog-status').innerText()
  };
}

async function playCard(page, card, label) {
  await card.locator('[data-public-play]').click();
  await page.waitForFunction(() => {
    const video = document.getElementById('public-video');
    return video && video.readyState >= 2 && video.videoWidth > 0;
  }, null, { timeout: 45000 });
  await page.waitForFunction(() => document.getElementById('public-video').currentTime >= 1, null, { timeout: 30000 });
  const state = await page.locator('#public-video').evaluate((video) => ({
    currentTime: video.currentTime,
    duration: video.duration,
    width: video.videoWidth,
    height: video.videoHeight,
    readyState: video.readyState,
    src: video.currentSrc
  }));
  assert.ok(state.currentTime >= 1, `${label}: playback time advances`);
  assert.ok(state.width > 0 && state.height > 0, `${label}: decoded dimensions are available`);
  return state;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const result = { status: 'pass', providers: {} };
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light' });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(`console: ${message.text()}`); });
    const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    assert.ok(response && response.ok(), 'page response is OK');
    assert.ok((await page.locator('body').innerText()).includes('公开版权电影：真实搜索并直接播放'), 'public catalog UI renders');
    assert.equal(await page.locator('[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay').count(), 0, 'no framework error overlay');

    const wikimediaSearch = await search(page, 'wikimedia', 'Big Buck Bunny');
    assert.ok(wikimediaSearch.cards >= 1, 'Wikimedia returns licensed video cards');
    assert.match(wikimediaSearch.providerStatus, /Wikimedia Commons\s+\d+ 条/);
    const wikiCard = page.locator('.public-result-card').filter({ hasText: 'closing credits' }).first();
    const selectedWikiCard = await wikiCard.count() ? wikiCard : page.locator('.public-result-card').first();
    result.providers.wikimedia = Object.assign(wikimediaSearch, { playback: await playCard(page, selectedWikiCard, 'Wikimedia') });
    assert.match(await page.locator('#public-player-license').innerText(), /CC BY/);
    assert.match(await page.locator('#public-player-attribution').innerText(), /Blender Foundation/i);
    await page.locator('#public-player').screenshot({ path: path.join(evidenceDir, 'public-wikimedia-playback.png') });

    const iaSearch = await search(page, 'internet_archive', 'Big Buck Bunny');
    assert.ok(iaSearch.cards >= 1, 'Internet Archive returns explicitly licensed movie cards');
    const iaCard = page.locator('.public-result-card').filter({ hasText: '640x360' }).first();
    const selectedIaCard = await iaCard.count() ? iaCard : page.locator('.public-result-card').first();
    result.providers.internet_archive = Object.assign(iaSearch, { playback: await playCard(page, selectedIaCard, 'Internet Archive') });
    assert.match(await page.locator('#public-player-provider').innerText(), /Internet Archive/);

    const nasaSearch = await search(page, 'nasa', 'Apollo 11');
    assert.ok(nasaSearch.cards >= 1, 'NASA returns official video records');
    result.providers.nasa = Object.assign(nasaSearch, { playback: await playCard(page, page.locator('.public-result-card').first(), 'NASA') });
    assert.match(await page.locator('#public-player-rights').innerText(), /不得暗示背书/);

    const beforeLocMedia = await page.locator('#public-video').evaluate((video) => video.currentSrc);
    const locSearch = await search(page, 'loc', 'silent film');
    assert.ok(locSearch.cards >= 1, 'Library of Congress returns film/video records');
    const lockedCard = page.locator('.public-result-card.is-locked').first();
    assert.ok(await lockedCard.count(), 'LOC result without explicit rights statement is visibly locked');
    await lockedCard.locator('[data-public-play]').click();
    await page.locator('#public-play-state').filter({ hasText: 'RIGHTS REVIEW' }).waitFor({ timeout: 3000 });
    assert.match(await page.locator('#public-player-rights').innerText(), /逐条权利声明|人工/);
    assert.deepEqual(await page.locator('#public-video').evaluate((video) => ({ src: video.getAttribute('src'), paused: video.paused })), { src: null, paused: true }, 'rights review removes the source attribute and stops playback');
    result.providers.loc = Object.assign(locSearch, { gate: 'RIGHTS REVIEW', previousMedia: Boolean(beforeLocMedia) });

    await page.locator('#public-catalog-lab').evaluate((element) => element.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: path.join(evidenceDir, 'public-catalog-complete.png'), fullPage: false });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, 'desktop has no horizontal overflow');
    assert.deepEqual(consoleErrors, [], `no console errors: ${consoleErrors.join('; ')}`);
    assert.equal(await page.evaluate(() => window.__consoleErrors.length), 0, 'window error capture remains empty');
    await context.close();

    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark', reducedMotion: 'reduce' });
    const mobilePage = await mobile.newPage();
    await mobilePage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    const mobileSearch = await search(mobilePage, 'wikimedia', 'Sintel');
    assert.ok(mobileSearch.cards >= 1, 'mobile search returns results');
    assert.equal(await mobilePage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, 'mobile has no horizontal overflow');
    await mobilePage.locator('#public-catalog-lab').screenshot({ path: path.join(evidenceDir, 'public-catalog-mobile.png') });
    result.mobile = { viewport: mobilePage.viewportSize(), noOverflow: true, reducedMotion: true };
    await mobile.close();

    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
