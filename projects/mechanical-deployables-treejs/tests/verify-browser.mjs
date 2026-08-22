import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { stat, readFile } from 'node:fs/promises';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mime = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.mp3', 'audio/mpeg'],
]);

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let target = resolve(projectRoot, `.${pathname}`);
    const targetRelative = relative(projectRoot, target);
    const outside = targetRelative === '..'
      || targetRelative.startsWith(`..${sep}`)
      || isAbsolute(targetRelative);
    if (outside) throw new Error('Path outside project root');
    if ((await stat(target)).isDirectory()) target = resolve(target, 'index.html');
    response.writeHead(200, { 'content-type': mime.get(extname(target)) || 'application/octet-stream' });
    response.end(await readFile(target));
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});

await new Promise((resolveListening) => server.listen(0, '127.0.0.1', resolveListening));
const { port } = server.address();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(error.message));

try {
  await page.goto(`http://127.0.0.1:${port}/upstream/`, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('#switch button').count(), 11);
  assert.match(await page.locator('#audit').textContent(), /clean/);
  await page.locator('button[data-clip="deploy"]').click();
  await page.waitForTimeout(400);
  assert.ok(Number(await page.locator('#scrub').inputValue()) > 0);
  await page.screenshot({ path: resolve(projectRoot, 'evidence/upstream-baseline.png') });

  await page.goto(`http://127.0.0.1:${port}/lab/`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.fleetLab?.rigs().length === 9);
  await page.waitForTimeout(500);
  await page.screenshot({ path: resolve(projectRoot, 'evidence/fleet-lab.png') });
  await page.locator('#deploy').click();
  await page.waitForTimeout(500);
  const deployStats = await page.evaluate(() => window.fleetLab.scheduler.stats());
  assert.equal(deployStats.rigs, 9);
  assert.ok(deployStats.active > 0);
  await page.locator('#count').selectOption('25');
  await page.waitForFunction(() => window.fleetLab.rigs().length === 25);
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => window.fleetLab.rigs().length), 25);

  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto(`http://127.0.0.1:${port}/showcase/#original`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.showcase?.ready === true);
  assert.equal(await page.evaluate(() => window.showcase.mode()), 'original');
  const upstreamFrame = page.frameLocator('#upstream-frame');
  assert.equal(await upstreamFrame.locator('#switch button').count(), 11);
  await upstreamFrame.locator('button[data-clip="deploy"]').click();
  await page.waitForTimeout(2200);
  assert.ok(Number(await upstreamFrame.locator('#scrub').inputValue()) > 0);
  await page.screenshot({ path: resolve(projectRoot, 'evidence/showcase-original.png') });

  await page.locator('[data-mode="technical"]').click();
  await page.waitForFunction(() => window.showcase.mode() === 'technical');
  await page.locator('#tech-steps button').nth(5).click();
  await page.waitForTimeout(650);
  assert.match(await page.locator('#tech-title').textContent(), /铰链/);
  assert.ok((await page.evaluate(() => window.showcase.tech().time)) > 3.5);
  await page.screenshot({ path: resolve(projectRoot, 'evidence/showcase-technical.png') });

  await page.locator('[data-mode="story"]').click();
  await page.waitForFunction(() => window.showcase.mode() === 'story');
  await page.locator('#story-play').click();
  await page.waitForFunction(() => window.showcase.story().chapter === 1, null, { timeout: 4000 });
  assert.match(await page.locator('#story-title').textContent(), /信号/);
  await page.locator('#story-chapters button').nth(3).click();
  await page.waitForTimeout(1100);
  const storyState = await page.evaluate(() => window.showcase.story());
  assert.equal(storyState.chapter, 3);
  assert.equal(await page.locator('#story-chapters button[aria-current="step"]').count(), 1);
  await page.screenshot({ path: resolve(projectRoot, 'evidence/showcase-story.png') });
  for (let chapterIndex = 0; chapterIndex < 6; chapterIndex += 1) {
    await page.locator('#story-chapters button').nth(chapterIndex).click();
    assert.equal(await page.evaluate(() => window.showcase.story().chapter), chapterIndex);
    assert.ok((await page.locator('#story-title').textContent()).trim().length > 0);
  }
  await page.locator('#story-reset').click();
  assert.equal(await page.evaluate(() => window.showcase.story().chapter), 0);

  await page.locator('[data-mode="families"]').click();
  await page.waitForFunction(() => window.showcase.mode() === 'families');
  assert.equal(await page.locator('#family-tabs button').count(), 5);
  assert.equal(await page.locator('#family-items button').count(), 3);
  const familyCatalog = await page.evaluate(() => window.showcase.families().catalog);
  assert.equal(familyCatalog.length, 5);
  assert.ok(familyCatalog.every((family) => family.items.length === 3));
  assert.equal(await page.evaluate(() => window.showcase.families().visible), 3);
  const initialGenerated = await page.evaluate(() => window.showcase.families().generated);
  assert.equal(initialGenerated.generator, 'tracked-vehicle-v1');
  assert.equal(initialGenerated.rules.pass, true);
  assert.equal(initialGenerated.continuity.pass, true);
  assert.match(await page.locator('#family-parameters').textContent(), /L6\.20.*6轮.*turret/);
  assert.match(await page.locator('#family-cycle').textContent(), /stowed.*active.*work.*stowed/);
  const payloads = [];
  for (let itemIndex = 0; itemIndex < 3; itemIndex += 1) {
    await page.locator('#family-items button').nth(itemIndex).click();
    const generated = await page.evaluate(() => window.showcase.families().generated);
    payloads.push(generated.config.payload);
    assert.equal(generated.rules.pass, true);
    assert.equal(generated.continuity.pass, true);
  }
  assert.deepEqual(payloads, ['turret', 'radar', 'engineer']);
  await page.locator('#family-items button').nth(1).click();
  await page.locator('#family-play').click();
  await page.waitForTimeout(700);
  assert.ok((await page.evaluate(() => window.showcase.families().time)) > 0.4);
  assert.equal(await page.locator('#family-state-strip .is-active').count(), 1);
  await page.screenshot({ path: resolve(projectRoot, 'evidence/showcase-families.png') });
  await page.locator('#family-next').click();
  assert.equal(await page.evaluate(() => window.showcase.families().family), 'air');
  await page.locator('#family-items button').nth(1).click();
  assert.equal(await page.evaluate(() => window.showcase.families().item), 'tilt-rotor');

  await page.locator('[data-mode="original"]').focus();
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.mode), 'technical');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.showcase.mode() === 'technical');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
  await page.locator('[data-mode="story"]').click();
  await page.locator('#story-next').click();
  assert.equal(await page.evaluate(() => window.showcase.story().chapter), 1);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#story-chapters button').nth(3).click();
  await page.waitForTimeout(250);
  const mobileLayout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewport: innerWidth,
    panel: document.querySelector('#story-panel').getBoundingClientRect().toJSON(),
    canvasVisible: getComputedStyle(document.querySelector('#stage')).display !== 'none',
  }));
  assert.ok(mobileLayout.scrollWidth <= mobileLayout.viewport);
  assert.ok(mobileLayout.panel.left >= 0 && mobileLayout.panel.right <= mobileLayout.viewport);
  assert.equal(mobileLayout.canvasVisible, true);
  await page.screenshot({ path: resolve(projectRoot, 'evidence/showcase-mobile.png') });

  await page.locator('[data-mode="families"]').click();
  await page.locator('#family-tabs button').nth(0).click();
  await page.locator('#family-items button').nth(2).click();
  await page.waitForTimeout(250);
  const familyMobileLayout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewport: innerWidth,
    panel: document.querySelector('#family-panel').getBoundingClientRect().toJSON(),
    visible: window.showcase.families().visible,
    payload: window.showcase.families().generated?.config.payload,
    parametersDisplay: getComputedStyle(document.querySelector('#family-parameters-row')).display,
  }));
  assert.ok(familyMobileLayout.scrollWidth <= familyMobileLayout.viewport);
  assert.ok(familyMobileLayout.panel.left >= 0 && familyMobileLayout.panel.right <= familyMobileLayout.viewport);
  assert.equal(familyMobileLayout.visible, 3);
  assert.equal(familyMobileLayout.payload, 'engineer');
  assert.notEqual(familyMobileLayout.parametersDisplay, 'none');
  await page.screenshot({ path: resolve(projectRoot, 'evidence/showcase-families-mobile.png') });

  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(`http://127.0.0.1:${port}/showcase/?fallback=1`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.showcase?.mode === 'fallback');
  assert.equal(await page.locator('#fallback-view li').count(), 5);
  const fallbackLayout = await page.evaluate(() => ({
    fallbackDisplay: getComputedStyle(document.querySelector('#fallback-view')).display,
    spatialDisplay: getComputedStyle(document.querySelector('#spatial-view')).display,
    fallbackHeight: document.querySelector('#fallback-view').getBoundingClientRect().height,
    fallbackClass: document.querySelector('#fallback-view').className,
    spatialClass: document.querySelector('#spatial-view').className,
    stylesheets: [...document.styleSheets].map((sheet) => sheet.href),
  }));
  assert.notEqual(fallbackLayout.fallbackDisplay, 'none');
  assert.equal(fallbackLayout.spatialDisplay, 'none');
  assert.ok(fallbackLayout.fallbackHeight > 0);
  assert.deepEqual(errors, []);
  console.log('browser verification: upstream + fleet lab + four-mode showcase passed');
} finally {
  await browser.close();
  await new Promise((resolveClosed) => server.close(resolveClosed));
}
