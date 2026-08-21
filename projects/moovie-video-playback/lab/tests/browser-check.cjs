const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const bundledModules = process.env.CODEX_BUNDLED_NODE_MODULES;
const { chromium } = bundledModules
  ? require(path.join(bundledModules, 'playwright'))
  : require('playwright');

const baseUrl = process.env.MOOVIE_LAB_URL || 'http://127.0.0.1:4173/lab/';
const evidenceDir = path.resolve(__dirname, '..', 'evidence');
fs.mkdirSync(evidenceDir, { recursive: true });

async function verifyPage(page, label, screenshotName) {
  const consoleErrors = [];
  const expectedNetworkErrors = [];
  const scenarioMediaRequests = [];
  page.on('request', (request) => {
    if (request.url().includes('/hls/decodable-')) scenarioMediaRequests.push(request.url());
  });
  page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const location = message.location();
    if (message.text().includes('Failed to load resource') && location.url.includes('/hls/decodable-faulty/segment002.ts')) {
      expectedNetworkErrors.push(`console: ${message.text()}`);
    } else {
      consoleErrors.push(`console: ${message.text()}`);
    }
  });

  const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  assert.ok(response && response.ok(), `${label}: page response must be OK`);
  assert.ok((await page.locator('body').innerText()).length > 800, `${label}: page must contain meaningful content`);
  assert.equal(await page.locator('[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay').count(), 0, `${label}: no framework error overlay`);

  await page.locator('#run-all').click();
  await page.locator('#playback-verdict').filter({ hasText: '通过：真实 HLS 同集换线' }).waitFor({ timeout: 16000 });

  const stationStates = await page.locator('.station-status').allTextContents();
  assert.deepEqual(stationStates, ['已验证', '已验证', '已验证', '已验证'], `${label}: all four stations complete`);
  assert.match(await page.locator('#matching-output').innerText(), /演示源 C[\s\S]*拒绝/, `${label}: wrong-year source is rejected`);
  assert.match(await page.locator('#event-log').innerText(), /decoder_handoff[\s\S]*first_frame[\s\S]*fatal_error[\s\S]*source_switched[\s\S]*first_frame_recovered[\s\S]*played_after_switch/, `${label}: real HLS failover event order is visible`);
  assert.match(await page.locator('#player-unit').innerText(), /S01E03/, `${label}: canonical episode remains visible`);
  assert.ok(scenarioMediaRequests.some((url) => url.includes('/decodable-faulty/segment002.ts')), `${label}: matched failing candidate reaches Hls.js`);
  assert.ok(scenarioMediaRequests.some((url) => url.includes('/decodable-healthy/')), `${label}: matched healthy candidate reaches Hls.js`);
  assert.deepEqual(await page.evaluate(() => {
    const video = document.getElementById('safe-video');
    return [video.videoWidth, video.videoHeight, video.readyState >= 2];
  }), [640, 360, true], `${label}: station player shows a decoded frame`);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, `${label}: no horizontal overflow`);
  assert.equal(await page.evaluate(() => window.__consoleErrors.length), 0, `${label}: no captured window errors`);
  assert.deepEqual(consoleErrors, [], `${label}: no browser console errors`);
  assert.ok(expectedNetworkErrors.length >= 1, `${label}: injected 503 is observed as an expected network error`);

  if (screenshotName) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(120);
    await page.screenshot({ path: path.join(evidenceDir, screenshotName), fullPage: true });
    if (label === 'desktop-light') {
      await page.locator('#station-playback').evaluate((element) => element.scrollIntoView({ block: 'start' }));
      await page.evaluate(() => window.scrollBy(0, -92));
      await page.waitForTimeout(120);
      await page.locator('#station-playback').screenshot({ path: path.join(evidenceDir, 'scenario-real-hls-complete.png') });
    }
  }

  return {
    label,
    viewport: page.viewportSize(),
    theme: await page.locator('html').getAttribute('data-theme'),
    stationStates,
    verdict: await page.locator('#playback-verdict').innerText(),
    eventCount: await page.locator('#event-log li').count(),
    scenarioMediaRequestCount: scenarioMediaRequests.length,
    expectedInjectedNetworkErrors: expectedNetworkErrors.length,
    noOverflow: true,
    noConsoleErrors: true
  };
}

async function verifyKeyboard(page) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.locator('body').click({ position: { x: 2, y: 2 } });
  const focusPath = [];
  for (let index = 0; index < 5; index += 1) {
    await page.keyboard.press('Tab');
    focusPath.push(await page.evaluate(() => document.activeElement && (document.activeElement.id || document.activeElement.className || document.activeElement.tagName)));
    if ((await page.evaluate(() => document.activeElement && document.activeElement.id)) === 'run-all') break;
  }
  assert.ok(focusPath.includes('run-all'), `keyboard: run-all is reachable; got ${focusPath.join(' -> ')}`);
  assert.equal(await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle !== 'none'), true, 'keyboard: focused control has visible outline');
  await page.keyboard.press('Enter');
  await page.locator('#playback-verdict').filter({ hasText: '通过：真实 HLS 同集换线' }).waitFor({ timeout: 16000 });
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.locator('body').click({ position: { x: 2, y: 2 } });
  const searchFocusPath = [];
  for (let index = 0; index < 10; index += 1) {
    await page.keyboard.press('Tab');
    const activeId = await page.evaluate(() => document.activeElement && document.activeElement.id);
    searchFocusPath.push(activeId || await page.evaluate(() => document.activeElement && document.activeElement.className));
    if (activeId === 'catalog-query') break;
  }
  assert.ok(searchFocusPath.includes('catalog-query'), `keyboard: search is reachable; got ${searchFocusPath.join(' -> ')}`);
  await page.keyboard.type('荒原来信');
  await page.keyboard.press('Enter');
  await page.locator('.search-result-card').waitFor({ timeout: 3000 });
  assert.equal(await page.locator('.search-result-card').count(), 1, 'keyboard: Enter submits search');

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.locator('#fault-server-state.is-online').waitFor({ timeout: 3000 });
  await page.locator('body').click({ position: { x: 2, y: 2 } });
  const faultFocusPath = [];
  for (let index = 0; index < 40; index += 1) {
    await page.keyboard.press('Tab');
    const activeId = await page.evaluate(() => document.activeElement && document.activeElement.id);
    faultFocusPath.push(activeId || await page.evaluate(() => document.activeElement && document.activeElement.className));
    if (activeId === 'run-source-probe') break;
  }
  assert.ok(faultFocusPath.includes('run-source-probe'), 'keyboard: source fault probe is reachable');
  assert.equal(await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle !== 'none'), true, 'keyboard: fault control has visible outline');
  await page.keyboard.press('Enter');
  await page.locator('#source-probe-result.is-pass').waitFor({ timeout: 3000 });

  const hlsFocusPath = [];
  for (let index = 0; index < 20; index += 1) {
    await page.keyboard.press('Tab');
    const activeId = await page.evaluate(() => document.activeElement && document.activeElement.id);
    hlsFocusPath.push(activeId || await page.evaluate(() => document.activeElement && document.activeElement.className));
    if (activeId === 'run-hls-probe') break;
  }
  assert.ok(hlsFocusPath.includes('run-hls-probe'), 'keyboard: HLS probe is reachable');
  await page.keyboard.press('Enter');
  await page.locator('#hls-probe-result.is-pass').waitFor({ timeout: 3000 });
  const realHlsFocusPath = [];
  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press('Tab');
    const activeId = await page.evaluate(() => document.activeElement && document.activeElement.id);
    realHlsFocusPath.push(activeId || await page.evaluate(() => document.activeElement && document.activeElement.className));
    if (activeId === 'run-real-hls') break;
  }
  assert.ok(realHlsFocusPath.includes('run-real-hls'), 'keyboard: real HLS player is reachable');
  await page.keyboard.press('Enter');
  await page.locator('#real-hls-result').filter({ hasText: '真实 HLS 连续播放通过' }).waitFor({ timeout: 12000 });
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.id), 'run-real-hls-failover', 'keyboard: failover control follows healthy playback');
  return {
    focusPath,
    enterRunsJourney: true,
    searchFocusPath,
    enterSubmitsSearch: true,
    faultFocusPath,
    enterRunsSourceProbe: true,
    hlsFocusPath,
    enterRunsHlsProbe: true,
    realHlsFocusPath,
    enterRunsRealHls: true
  };
}

async function searchAndRun(page, query, expectedResultText, timeout = 12000) {
  await page.locator('#catalog-query').fill(query);
  await page.locator('#catalog-query').press('Enter');
  await page.locator('.search-result-card').waitFor({ timeout: 3000 });
  assert.equal(await page.locator('.search-result-card').count(), 1, `search ${query}: one exact result`);
  await page.locator('.search-result-card .result-action').click();
  await page.locator('#playback-verdict').filter({ hasText: expectedResultText }).waitFor({ timeout });
  return {
    query,
    selected: await page.locator('#current-scenario-label').innerText(),
    metadata: await page.locator('#metadata-output').innerText(),
    matching: await page.locator('#matching-output').innerText(),
    verdict: await page.locator('#playback-verdict').innerText(),
    events: await page.locator('#event-log').innerText()
  };
}

async function verifySearchVariants(page) {
  const scenarioMediaRequests = [];
  const externalProxyRequests = [];
  const externalProxyResponses = [];
  page.on('request', (request) => {
    if (request.url().includes('/hls/decodable-')) scenarioMediaRequests.push(request.url());
    if (request.url().includes('/external-hls/apple-bipbop/')) externalProxyRequests.push(request.url());
  });
  page.on('response', async (response) => {
    if (response.url().includes('/external-hls/apple-bipbop/')) {
      externalProxyResponses.push({ url: response.url(), status: response.status(), upstream: (await response.allHeaders())['x-moovie-upstream'] || '' });
    }
  });
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  assert.equal(await page.locator('.search-result-card').count(), 5, 'search: five examples visible initially, including one official external stream');

  const apple = await searchAndRun(page, 'Apple Bip Bop', '通过：Apple 官方外部 HLS 真实播放', 30000);
  assert.match(apple.selected, /Apple Developer · 官方外部 HLS 测试流/);
  assert.match(apple.metadata, /Apple Developer[\s\S]*apple_official:apple-bipbop-hls-example/);
  assert.match(apple.matching, /Apple Developer 官方测试流[\s\S]*接受 0\.95/);
  assert.match(apple.events, /decoder_handoff[\s\S]*manifest_loaded[\s\S]*first_frame[\s\S]*played_3s/);
  assert.match(await page.locator('#resources-source').innerText(), /devstreaming-cdn\.apple\.com[\s\S]*\/videos\/streaming\/examples\/bipbop_16x9\//);
  assert.match(await page.locator('#resources-output').innerText(), /官方测试流[\s\S]*白名单代理/);
  assert.ok(externalProxyRequests.some((url) => url.includes('bipbop_16x9_variant.m3u8')), 'external source: official master manifest was requested through the allowlist proxy');
  assert.ok(externalProxyRequests.some((url) => /gear\d+\/(fileSequence|prog_index)/.test(url)), 'external source: a nested Apple media playlist or segment was requested');
  assert.ok(externalProxyResponses.some((item) => item.status === 200 && item.upstream === 'developer.apple.com-hls-example'), 'external source: proxy response identifies the allowlisted Apple upstream');
  const appleVideo = await page.locator('#safe-video').evaluate((video) => ({ readyState: video.readyState, currentTime: video.currentTime, width: video.videoWidth, height: video.videoHeight, duration: video.duration }));
  assert.ok(appleVideo.readyState >= 2 && appleVideo.currentTime >= 3 && appleVideo.width > 0 && appleVideo.height > 0, `external source: real decoded video state ${JSON.stringify(appleVideo)}`);
  await page.locator('#station-playback').evaluate((element) => element.scrollIntoView({ block: 'start' }));
  await page.evaluate(() => window.scrollBy(0, -72));
  await page.screenshot({ path: path.join(evidenceDir, 'external-apple-hls-complete.png'), fullPage: false });
  await page.evaluate(() => window.MoovieRealHlsLab.stopScenario());
  await page.waitForTimeout(120);

  const tmdb = await searchAndRun(page, '荒原来信', '通过：真实 HLS 稳定播放');
  assert.match(tmdb.selected, /TMDB 回退/);
  assert.match(tmdb.metadata, /tmdb:demo-92001/i);
  assert.doesNotMatch(tmdb.events, /source_switched/);
  assert.match(tmdb.events, /decoder_handoff[\s\S]*first_frame[\s\S]*played_3s/);
  assert.ok(scenarioMediaRequests.some((url) => url.includes('/decodable-healthy/')), 'TMDB scenario: matched healthy candidate was really requested');

  await page.evaluate(() => window.MoovieRealHlsLab.stopScenario());
  await page.waitForTimeout(120);
  const beforeProvisional = scenarioMediaRequests.length;
  const provisional = await searchAndRun(page, '青石巷短剧', '待复核：不进入自动播放');
  assert.match(provisional.selected, /资源反向建档/);
  assert.match(provisional.metadata, /无外部 ID/);
  assert.match(provisional.matching, /复核 0\.75/);
  assert.match(provisional.events, /manual_review/);
  await page.waitForTimeout(200);
  assert.equal(scenarioMediaRequests.length, beforeProvisional, 'provisional scenario: no decodable media request is sent');

  const beforeNoResources = scenarioMediaRequests.length;
  const noResources = await searchAndRun(page, '孤岛样片', '空状态：0 个播放候选');
  assert.match(noResources.matching, /没有资源可匹配/);
  assert.match(noResources.events, /no_candidates/);
  await page.waitForTimeout(200);
  assert.equal(scenarioMediaRequests.length, beforeNoResources, 'no-resource scenario: no decodable media request is sent');

  await page.locator('#catalog-query').fill('完全不存在的影片');
  await page.locator('#catalog-query').press('Enter');
  assert.equal(await page.locator('.search-result-card').count(), 0, 'search: unknown query has no result card');
  assert.match(await page.locator('#search-results').innerText(), /没有找到/);

  return { apple: Object.assign(apple, { video: appleVideo, proxyRequestCount: externalProxyRequests.length }), tmdb, provisional, noResources, unknownQuery: 'pass' };
}

async function verifyFaultLab(page) {
  const localRequests = [];
  page.on('request', (request) => {
    if (request.url().startsWith('http://127.0.0.1:4174/')) localRequests.push(request.url());
  });
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.locator('#fault-server-state.is-online').waitFor({ timeout: 3000 });

  const modes = [
    ['healthy', /AppleCMS 响应有效/],
    ['rate_limit', /HTTP 429/],
    ['server_error', /HTTP 服务器错误/],
    ['invalid_json', /响应不可解析/],
    ['timeout', /超过 650 ms/]
  ];
  for (const [mode, expected] of modes) {
    await page.locator('#reset-fault-probe').click();
    await page.locator(`[data-fault-mode="${mode}"]`).click();
    await page.locator('#run-source-probe').click();
    await page.locator('#source-probe-result:not(.is-running)').waitFor({ timeout: 3000 });
    assert.match(await page.locator('#source-probe-result').innerText(), expected, `fault mode ${mode}: classified visibly`);
  }

  await page.locator('#run-breaker-demo').click();
  await page.locator('#source-probe-result').filter({ hasText: '熔断恢复闭环完成' }).waitFor({ timeout: 6000 });
  const circuitTimeline = await page.locator('#source-probe-log').innerText();
  assert.match(circuitTimeline, /OPEN[\s\S]*HALF-OPEN[\s\S]*CLOSED/, 'circuit: open, half-open and closed are visible in order');
  assert.equal(await page.locator('#circuit-state').innerText(), 'CLOSED', 'circuit: recovered state is closed');
  assert.equal(await page.locator('#circuit-failures').innerText(), '0 / 3', 'circuit: recovery clears failures');

  await page.locator('[data-hls-mode="manifest-error"]').click();
  await page.locator('#run-hls-probe').click();
  await page.locator('#hls-probe-result.is-fail').waitFor({ timeout: 3000 });
  assert.match(await page.locator('#hls-probe-result').innerText(), /HLS 清单请求失败/);

  await page.locator('[data-hls-mode="segment-error"]').click();
  await page.locator('#run-hls-probe').click();
  await page.locator('#hls-probe-result.is-fail').waitFor({ timeout: 3000 });
  assert.match(await page.locator('#hls-probe-result').innerText(), /首分片失败/);

  await page.locator('[data-hls-mode="failover"]').click();
  await page.locator('#run-hls-probe').click();
  await page.locator('#hls-probe-result.is-pass').filter({ hasText: '线路 2 传输通过' }).waitFor({ timeout: 3000 });
  assert.match(await page.locator('#hls-probe-log').innerText(), /线路 1[\s\S]*SWITCH[\s\S]*线路 2/, 'HLS: failed line switches to healthy line');
  assert.match(await page.locator('#hls-probe-result').innerText(), /尚未验证解码/, 'HLS: transport boundary remains visible');
  assert.ok(localRequests.length >= 15, `fault lab: expected real localhost requests, got ${localRequests.length}`);
  assert.ok(localRequests.some((url) => url.includes('/api.php/provide/vod')), 'fault lab: AppleCMS-shaped requests were sent');
  assert.ok(localRequests.some((url) => url.includes('.m3u8')), 'fault lab: HLS manifest requests were sent');
  assert.ok(localRequests.some((url) => url.includes('segment0.ts')), 'fault lab: HLS segment requests were sent');

  assert.equal(await page.evaluate(() => typeof Hls !== 'undefined' && Hls.isSupported()), true, 'real HLS: Hls.js and MSE are available');
  const hlsVersion = await page.evaluate(() => Hls.version);
  await page.locator('#run-real-hls').click();
  await page.locator('#real-hls-result').filter({ hasText: '真实 HLS 连续播放通过' }).waitFor({ timeout: 12000 });
  const healthyPlayback = await page.evaluate(() => ({
    readyState: document.getElementById('real-hls-video').readyState,
    currentTime: document.getElementById('real-hls-video').currentTime,
    videoWidth: document.getElementById('real-hls-video').videoWidth,
    videoHeight: document.getElementById('real-hls-video').videoHeight,
    snapshot: window.MoovieRealHlsLab.snapshot()
  }));
  assert.ok(healthyPlayback.readyState >= 2, 'real HLS: decoded frame data is available');
  assert.ok(healthyPlayback.currentTime >= 3, `real HLS: currentTime advanced to ${healthyPlayback.currentTime}`);
  assert.deepEqual([healthyPlayback.videoWidth, healthyPlayback.videoHeight], [640, 360], 'real HLS: decoded synthetic video dimensions are visible');
  assert.match(await page.locator('#real-hls-log').innerText(), /MANIFEST[\s\S]*FIRST_FRAME[\s\S]*PLAYED_3S/, 'real HLS: manifest, first frame and continuous playback are visible');

  await page.locator('#run-real-hls-failover').click();
  await page.locator('#real-hls-result').filter({ hasText: '真实解码换线闭环通过' }).waitFor({ timeout: 16000 });
  const failoverPlayback = await page.evaluate(() => window.MoovieRealHlsLab.snapshot());
  assert.equal(failoverPlayback.line, 'B', 'real HLS: healthy line B is selected after failure');
  assert.ok(failoverPlayback.savedTime > 0.5, `real HLS: non-zero playback position was captured (${failoverPlayback.savedTime})`);
  assert.ok(failoverPlayback.currentTime >= failoverPlayback.savedTime + 1.4, 'real HLS: playback continued after restored position');
  assert.match(await page.locator('#real-hls-log').innerText(), /FATAL_ERROR[\s\S]*SOURCE_SWITCHED[\s\S]*FIRST_FRAME_RECOVERED[\s\S]*PLAYED_AFTER_SWITCH/, 'real HLS: fatal failure and recovery event order is visible');
  assert.match(await page.locator('#real-hls-resume').innerText(), /s → .*s/, 'real HLS: before and after positions are visible');
  assert.ok(localRequests.some((url) => url.includes('/hls/decodable-faulty/segment002.ts')), 'real HLS: failing middle media segment was requested');
  assert.ok(localRequests.some((url) => url.includes('/hls/decodable-healthy/segment002.ts')), 'real HLS: healthy replacement media segment was requested');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, 'fault lab: no desktop overflow');

  await page.locator('.real-hls-panel').evaluate((element) => element.scrollIntoView({ block: 'start' }));
  await page.evaluate(() => window.scrollBy(0, -92));
  await page.waitForTimeout(120);
  await page.locator('.real-hls-panel').screenshot({ path: path.join(evidenceDir, 'real-hls-failover-complete.png') });
  await page.locator('#fault-lab').evaluate((element) => element.scrollIntoView({ block: 'start' }));
  await page.evaluate(() => window.scrollBy(0, -92));
  await page.waitForTimeout(120);
  await page.locator('#fault-lab').screenshot({ path: path.join(evidenceDir, 'fault-lab-complete.png') });
  await page.evaluate(() => { window.Hls = undefined; });
  await page.locator('#run-real-hls').click();
  await page.locator('#real-hls-result.is-fail').filter({ hasText: '当前浏览器不支持 HLS 解码' }).waitFor({ timeout: 3000 });
  assert.equal(await page.locator('#run-hls-probe').isEnabled(), true, 'real HLS fallback: transport probe remains available');
  return {
    server: 'online',
    sourceModes: modes.map(([mode]) => mode),
    circuitTimeline: 'closed -> open -> half-open -> closed',
    hls: ['manifest_error', 'segment_error', 'line_1_to_line_2'],
    localRequestCount: localRequests.length,
    transportBoundaryVisible: true,
    mseFallbackVisible: true,
    realHls: {
      hlsJs: hlsVersion,
      healthyPlayback,
      failoverPlayback
    }
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light' });
    const desktopPage = await desktopContext.newPage();
    results.push(await verifyPage(desktopPage, 'desktop-light', 'desktop-search-complete.png'));
    await desktopPage.locator('#theme-toggle').click();
    assert.equal(await desktopPage.locator('html').getAttribute('data-theme'), 'dark', 'theme: light-to-dark switch works');
    results.push({ themeTransition: 'light-to-dark', result: 'pass' });
    results.push({ searchVariants: await verifySearchVariants(await desktopContext.newPage()) });
    results.push({ faultLab: await verifyFaultLab(await desktopContext.newPage()) });
    await desktopContext.close();

    const tabletContext = await browser.newContext({ viewport: { width: 768, height: 1024 }, colorScheme: 'light' });
    results.push(await verifyPage(await tabletContext.newPage(), 'tablet-light', null));
    await tabletContext.close();

    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark', reducedMotion: 'reduce' });
    results.push(await verifyPage(await mobileContext.newPage(), 'mobile-dark-reduced-motion', 'mobile-dark-complete.png'));
    await mobileContext.close();

    const keyboardContext = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
    results.push({ keyboard: await verifyKeyboard(await keyboardContext.newPage()) });
    await keyboardContext.close();

    process.stdout.write(`${JSON.stringify({ status: 'pass', url: baseUrl, results }, null, 2)}\n`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
