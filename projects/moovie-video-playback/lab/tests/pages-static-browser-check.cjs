'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const bundledModules = process.env.CODEX_BUNDLED_NODE_MODULES;
const { chromium } = bundledModules ? require(path.join(bundledModules, 'playwright')) : require('playwright');
const baseUrl = process.env.MOOVIE_LAB_URL || 'https://yydshly.github.io/0821_githubcode_study/demos/moovie-video-playback/';
const evidenceDir = path.resolve(__dirname, '..', 'evidence');
fs.mkdirSync(evidenceDir, { recursive: true });

async function verifyStaticPage(page, label, screenshotName) {
  const consoleErrors = [];
  const mediaRequests = [];
  page.on('request', (request) => {
    if (request.url().includes('/media/hls')) mediaRequests.push(request.url());
  });
  page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const location = message.location();
    if ((location.url || '').includes('missing-segment002.ts') || message.text().includes('missing-segment002.ts')) return;
    consoleErrors.push(`console: ${message.text()}`);
  });

  const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  assert.ok(response && response.ok(), `${label}: page response is OK`);
  assert.equal(await page.locator('html').getAttribute('data-runtime'), 'static-pages', `${label}: Pages runtime is detected`);
  await page.locator('#runtime-mode-banner').waitFor({ state: 'visible' });
  assert.match(await page.locator('#runtime-mode-banner').innerText(), /原研究实验室[\s\S]*在线静态研究模式[\s\S]*4174/);
  assert.equal(await page.locator('#public-catalog-search button[type="submit"]').isDisabled(), true, `${label}: public gateway search is not misrepresented as live`);
  assert.equal(await page.locator('#run-source-probe').isDisabled(), true, `${label}: AppleCMS fault gateway control is disabled`);
  assert.equal(await page.locator('#run-hls-probe').isDisabled(), true, `${label}: transport fault gateway control is disabled`);
  assert.equal(await page.locator('#run-real-hls').isEnabled(), true, `${label}: static HLS decode remains runnable`);
  assert.equal(await page.evaluate(() => typeof Hls !== 'undefined' && Hls.version), '1.4.12', `${label}: pinned Hls.js loads`);

  await page.locator('#run-all').click();
  await page.locator('#playback-verdict').filter({ hasText: '通过：真实 HLS 同集换线' }).waitFor({ timeout: 18000 });
  assert.match(await page.locator('#event-log').innerText(), /decoder_handoff[\s\S]*fatal_error[\s\S]*source_switched[\s\S]*first_frame_recovered[\s\S]*played_after_switch/);
  assert.ok(mediaRequests.some((url) => url.includes('/media/hls-faulty/missing-segment002.ts')), `${label}: static failing segment is requested`);
  assert.ok(mediaRequests.some((url) => url.includes('/media/hls/index.m3u8')), `${label}: healthy static line is requested after failure`);
  assert.deepEqual(await page.evaluate(() => {
    const video = document.getElementById('safe-video');
    return [video.videoWidth, video.videoHeight, video.readyState >= 2];
  }), [640, 360, true], `${label}: decoded synthetic frame is visible`);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, `${label}: no horizontal overflow`);
  const capturedWindowErrors = await page.evaluate(() => window.__consoleErrors.slice());
  assert.deepEqual(capturedWindowErrors, [], `${label}: no captured window errors: ${JSON.stringify(capturedWindowErrors)}`);
  assert.deepEqual(consoleErrors, [], `${label}: no unexpected browser console errors`);

  if (screenshotName) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(120);
    await page.screenshot({ path: path.join(evidenceDir, screenshotName), fullPage: true });
  }

  return {
    label,
    viewport: page.viewportSize(),
    verdict: await page.locator('#playback-verdict').innerText(),
    mediaRequestCount: mediaRequests.length,
    noOverflow: true,
    noUnexpectedConsoleErrors: true
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light' });
    const desktopPage = await desktop.newPage();
    results.push(await verifyStaticPage(desktopPage, 'pages-desktop', 'pages-lab-desktop.png'));
    await desktopPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await desktopPage.locator('#catalog-query').fill('Apple Bip Bop');
    await desktopPage.locator('#catalog-query').press('Enter');
    await desktopPage.locator('.search-result-card .result-action').click();
    await desktopPage.locator('#playback-verdict').filter({ hasText: '边界明确' }).waitFor({ timeout: 5000 });
    assert.match(await desktopPage.locator('#event-log').innerText(), /local_gateway_required/);
    await desktopPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await desktopPage.keyboard.press('Tab');
    assert.equal(await desktopPage.evaluate(() => document.activeElement && document.activeElement.getAttribute('href')), '#research-main', 'keyboard: skip link is first');
    await desktop.close();

    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark', reducedMotion: 'reduce' });
    results.push(await verifyStaticPage(await mobile.newPage(), 'pages-mobile', 'pages-lab-mobile.png'));
    await mobile.close();

    process.stdout.write(`${JSON.stringify({ status: 'pass', url: baseUrl, results }, null, 2)}\n`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
