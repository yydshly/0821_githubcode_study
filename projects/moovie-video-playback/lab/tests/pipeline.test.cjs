const test = require('node:test');
const assert = require('node:assert/strict');
const fixtures = require('../fixtures.js');
const pipeline = require('../pipeline.js');

test('豆瓣样本被规范为内部媒体身份', () => {
  const media = pipeline.normalizeMetadata(fixtures.douban.response);
  assert.equal(media.id, 'media-demo-001');
  assert.equal(media.external_ids.douban, 'demo-35700001');
  assert.equal(media.type, 'tv');
  assert.equal(media.season, 1);
  assert.equal(media.rating, 8.3);
});

test('常见季集标题统一为同一个 episode key', () => {
  for (const label of ['S01E03', '第1季第3集', '第3集', 'EP03', 'E3', '3']) {
    assert.equal(pipeline.parseEpisodeLabel(label, 1).episode_key, 'S01E03', label);
  }
  assert.equal(pipeline.parseEpisodeLabel('花絮', 1).recognized, false);
});

test('AppleCMS 播放串拆分线路和剧集，并明确过滤 MP4', () => {
  const parsed = pipeline.parseAppleCmsResource(fixtures.appleCms.resources[1]);
  assert.equal(parsed.candidates.length, 2);
  assert.equal(parsed.rejected.length, 1);
  assert.equal(parsed.rejected[0].format, 'unsupported');
  assert.match(parsed.rejected[0].reason, /m3u8/);
});

test('匹配优先精确 ID、支持标题层并拒绝年份冲突', () => {
  const media = pipeline.normalizeMetadata(fixtures.douban.response);
  const [exact, titleExact, wrongYear] = fixtures.appleCms.resources.map((item) => pipeline.matchResource(media, item));
  assert.deepEqual([exact.decision, exact.method, exact.confidence], ['auto_accept', 'exact_external_id', 1]);
  assert.deepEqual([titleExact.decision, titleExact.method, titleExact.confidence], ['auto_accept', 'title_year_type_exact', 0.95]);
  assert.equal(wrongYear.decision, 'reject');
  assert.match(wrongYear.conflicts[0], /year_conflict/);
});

test('候选排序只保留同一集和高置信度映射', () => {
  const media = pipeline.normalizeMetadata(fixtures.douban.response);
  const ranked = pipeline.rankCandidates(media, fixtures.targetEpisode, fixtures.appleCms.resources);
  assert.equal(ranked.length, 2);
  assert.ok(ranked.every((item) => item.episode_key === 'S01E03'));
  assert.ok(ranked.every((item) => item.media_unit_id === fixtures.targetEpisode.media_unit_id));
  assert.ok(ranked.every((item) => item.match.confidence >= 0.9));
  assert.ok(ranked[0].candidate_score >= ranked[1].candidate_score);
});

test('自动换线不跨 media unit，并保留播放位置', () => {
  const media = pipeline.normalizeMetadata(fixtures.douban.response);
  const ranked = pipeline.rankCandidates(media, fixtures.targetEpisode, fixtures.appleCms.resources);
  const trace = pipeline.buildFailoverTrace(ranked, fixtures.targetEpisode.media_unit_id, 326.5);
  assert.deepEqual(trace.map((row) => row.event), [
    'attempt_started',
    'fatal_error',
    'source_switched',
    'manifest_loaded',
    'first_frame',
    'played_10s'
  ]);
  assert.equal(trace[2].preserved, true);
  assert.equal(trace[2].position, 328.3);

  const poisoned = ranked.concat([{ ...ranked[1], candidate_id: 'wrong-unit', media_unit_id: 'media-demo-001:S01E04' }]);
  const next = pipeline.nextSafeCandidate(poisoned, ranked[0].candidate_id, [ranked[0].candidate_id, ranked[1].candidate_id], fixtures.targetEpisode.media_unit_id);
  assert.equal(next, null);
});

function mediaForScenario(scenario) {
  return pipeline.normalizeMetadata(scenario.metadata.response, {
    provider: scenario.metadata.provider,
    externalId: scenario.metadata.externalId,
    internalId: scenario.metadata.internalId,
    status: scenario.metadata.status
  });
}

test('搜索支持片名和来源场景关键词，并对未知词返回空结果', () => {
  assert.equal(pipeline.searchScenarios(fixtures.scenarios, '荒原来信')[0].id, 'letters-from-wasteland');
  assert.equal(pipeline.searchScenarios(fixtures.scenarios, 'Apple Bip Bop')[0].id, 'apple-bip-bop');
  const noDouban = pipeline.searchScenarios(fixtures.scenarios, '豆瓣没有').map((item) => item.id);
  assert.ok(noDouban.includes('letters-from-wasteland'));
  assert.ok(noDouban.includes('stone-alley-short'));
  assert.deepEqual(pipeline.searchScenarios(fixtures.scenarios, '完全不存在的影片'), []);
});

test('豆瓣无结果时 TMDB 可以建立规范 Media 并参与精确匹配', () => {
  const scenario = fixtures.scenarios.find((item) => item.id === 'letters-from-wasteland');
  const media = mediaForScenario(scenario);
  assert.deepEqual(media.external_ids, { tmdb: 'demo-92001' });
  assert.equal(media.metadata_provider, 'tmdb');
  const match = pipeline.matchResource(media, scenario.resource.resources[0]);
  assert.deepEqual([match.decision, match.method, match.confidence], ['auto_accept', 'exact_external_id', 1]);
  assert.ok(match.evidence.includes('tmdb_id_equal'));
});

test('资源反向建档只进入人工复核，不产生自动播放候选', () => {
  const scenario = fixtures.scenarios.find((item) => item.id === 'stone-alley-short');
  const media = mediaForScenario(scenario);
  assert.equal(media.status, 'provisional');
  assert.deepEqual(media.external_ids, {});
  const match = pipeline.matchResource(media, scenario.resource.resources[0]);
  assert.deepEqual([match.decision, match.method, match.confidence], ['review', 'provisional_identity', 0.75]);
  assert.deepEqual(pipeline.rankCandidates(media, scenario.targetEpisode, scenario.resource.resources), []);
});

test('元数据存在但资源为空时明确得到零候选', () => {
  const scenario = fixtures.scenarios.find((item) => item.id === 'island-sample');
  const media = mediaForScenario(scenario);
  assert.equal(media.status, 'confirmed');
  assert.deepEqual(pipeline.rankCandidates(media, scenario.targetEpisode, scenario.resource.resources), []);
  assert.deepEqual(pipeline.buildFailoverTrace([], scenario.targetEpisode.media_unit_id, 0), []);
});

test('稳定单线路直接成功，不伪造失败换线事件', () => {
  const scenario = fixtures.scenarios.find((item) => item.id === 'letters-from-wasteland');
  const media = mediaForScenario(scenario);
  const ranked = pipeline.rankCandidates(media, scenario.targetEpisode, scenario.resource.resources);
  const trace = pipeline.buildFailoverTrace(ranked, scenario.targetEpisode.media_unit_id, 120);
  assert.deepEqual(trace.map((event) => event.event), ['attempt_started', 'manifest_loaded', 'first_frame', 'played_10s']);
  assert.ok(!trace.some((event) => event.event === 'source_switched'));
});

test('可播放场景的排序结果携带真实本地或官方代理 HLS，安全场景没有候选', () => {
  const harbor = fixtures.scenarios.find((item) => item.id === 'harbor-files');
  const harborRanked = pipeline.rankCandidates(mediaForScenario(harbor), harbor.targetEpisode, harbor.resource.resources);
  assert.match(harborRanked[0].url, /decodable-faulty\/index\.m3u8$/);
  assert.match(harborRanked[1].url, /decodable-healthy\/index\.m3u8$/);

  const desert = fixtures.scenarios.find((item) => item.id === 'letters-from-wasteland');
  const desertRanked = pipeline.rankCandidates(mediaForScenario(desert), desert.targetEpisode, desert.resource.resources);
  assert.match(desertRanked[0].url, /decodable-healthy\/index\.m3u8$/);

  const apple = fixtures.scenarios.find((item) => item.id === 'apple-bip-bop');
  const appleRanked = pipeline.rankCandidates(mediaForScenario(apple), apple.targetEpisode, apple.resource.resources);
  assert.equal(appleRanked.length, 1);
  assert.match(appleRanked[0].url, /^http:\/\/127\.0\.0\.1:4174\/external-hls\/apple-bipbop\/bipbop_16x9_variant\.m3u8$/);
  assert.equal(apple.resource.origin.upstreamHost, 'devstreaming-cdn.apple.com');

  for (const id of ['stone-alley-short', 'island-sample']) {
    const scenario = fixtures.scenarios.find((item) => item.id === id);
    assert.deepEqual(pipeline.rankCandidates(mediaForScenario(scenario), scenario.targetEpisode, scenario.resource.resources), []);
  }
});
