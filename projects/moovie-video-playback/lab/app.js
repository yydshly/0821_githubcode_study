(function () {
  'use strict';

  var fixtures = window.MoovieFixtures;
  var pipeline = window.MooviePipeline;
  var scenarios = fixtures.scenarios || [];
  var currentScenario = scenarios.find(function (scenario) { return scenario.id === fixtures.defaultScenarioId; }) || scenarios[0];
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var derived = {};
  var running = false;
  var runToken = 0;
  var streamAnimation = null;
  var streamObject = null;
  var streamRoute = 'SAFE FIXTURE STREAM';

  var runAllButton = document.getElementById('run-all');
  var resetButton = document.getElementById('reset-lab');
  var themeButton = document.getElementById('theme-toggle');
  var themeLabel = document.getElementById('theme-label');
  var themeIcon = document.getElementById('theme-icon');
  var announcer = document.getElementById('live-announcer');
  var progressBar = document.getElementById('global-progress-bar');
  var searchForm = document.getElementById('catalog-search');
  var searchInput = document.getElementById('catalog-query');
  var searchClear = document.getElementById('search-clear');
  var searchResults = document.getElementById('search-results');
  var searchFeedback = document.getElementById('search-feedback');

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function wait(ms, token) {
    var duration = reducedMotion ? Math.min(ms, 18) : ms;
    return new Promise(function (resolve, reject) {
      window.setTimeout(function () {
        if (token !== runToken) reject(new Error('run_cancelled'));
        else resolve();
      }, duration);
    });
  }

  function announce(message) {
    announcer.textContent = '';
    window.setTimeout(function () { announcer.textContent = message; }, 10);
  }

  function setBusy(value) {
    running = value;
    runAllButton.disabled = value;
    resetButton.disabled = value;
    document.querySelectorAll('[data-run-step]').forEach(function (button) { button.disabled = value; });
    document.querySelectorAll('.result-action').forEach(function (button) { button.disabled = value; });
    searchInput.disabled = value;
    searchForm.querySelector('.search-submit').disabled = value;
    runAllButton.innerHTML = value ? '<span aria-hidden="true">●</span> 正在运行' : '<span aria-hidden="true">▶</span> 运行当前示例';
  }

  function setStatus(step, state, text) {
    var status = document.querySelector('[data-status-for="' + step + '"]');
    if (!status) return;
    status.className = 'station-status status-' + state;
    status.textContent = text;
    document.querySelectorAll('[data-route-step]').forEach(function (button) {
      var buttonStep = Number(button.getAttribute('data-route-step'));
      button.classList.toggle('is-active', buttonStep === step && state === 'running');
      if (buttonStep === step && state === 'success') button.classList.add('is-complete');
    });
  }

  function updateProgress(step) {
    progressBar.style.width = Math.max(0, Math.min(100, step * 25)) + '%';
  }

  function buildCurrentMedia() {
    var metadata = currentScenario.metadata;
    return pipeline.normalizeMetadata(metadata.response, {
      provider: metadata.provider,
      externalId: metadata.externalId,
      internalId: metadata.internalId,
      status: metadata.status
    });
  }

  function renderMetadata() {
    var metadata = currentScenario.metadata;
    var raw = metadata.response;
    derived.media = buildCurrentMedia();
    document.getElementById('metadata-source').textContent = JSON.stringify({
      provider: metadata.providerLabel,
      endpoint: metadata.endpoint,
      response: {
        id: raw.id,
        title: raw.title,
        year: raw.year,
        type: raw.type,
        rating: raw.rating,
        genres: raw.genres
      },
      provider_states: currentScenario.providerStates,
      notice: fixtures.researchNotice
    }, null, 2);

    var sourceTitle = document.getElementById('metadata-source-title');
    var sourceCopy = document.getElementById('metadata-source-copy');
    var sourceLink = document.getElementById('metadata-code-link');
    sourceLink.removeAttribute('target');
    sourceLink.removeAttribute('rel');
    if (metadata.provider === 'douban') {
      sourceTitle.textContent = '豆瓣 Web / Rexxar 数据形状';
      sourceCopy.textContent = '豆瓣命中详情，提供片名、年份、类型、评分和外部 ID。';
      sourceLink.href = '../upstream/v4.0.0/internal/catalog/douban.go';
      sourceLink.innerHTML = '查看上游证据：catalog/douban.go <span>↗</span>';
    } else if (metadata.provider === 'tmdb') {
      sourceTitle.textContent = 'TMDB 元数据回退';
      sourceCopy.textContent = '豆瓣无结果后由第二 MetadataProvider 建立相同的内部 Media。';
      sourceLink.href = '../upstream/v4.0.0/internal/catalog/tmdb.go';
      sourceLink.innerHTML = '查看上游证据：catalog/tmdb.go <span>↗</span>';
    } else if (metadata.provider === 'apple_official') {
      sourceTitle.textContent = 'Apple Developer 官方 HLS 示例';
      sourceCopy.textContent = '这是官方公开的播放能力测试流，不是影视资源站，也不提供影视检索。';
      sourceLink.href = 'https://developer.apple.com/streaming/examples/';
      sourceLink.target = '_blank';
      sourceLink.rel = 'noreferrer';
      sourceLink.innerHTML = '查看官方来源：Apple HLS Examples <span>↗</span>';
    } else {
      sourceTitle.textContent = '资源反向建档';
      sourceCopy.textContent = '所有元数据源均无结果，只从资源标题生成待人工确认的临时 Media。';
      sourceLink.href = '../upstream/v4.0.0/internal/mediaidentity/resource_parse.go';
      sourceLink.innerHTML = '查看上游证据：resource_parse.go <span>↗</span>';
    }

    var media = derived.media;
    var rating = media.rating == null ? '<span class="media-rating no-rating">待补充</span>' : '<span class="media-rating">' + media.rating.toFixed(1) + '</span>';
    var externalEntries = Object.keys(media.external_ids).map(function (key) { return key + ':' + media.external_ids[key]; });
    var identityEvidence = externalEntries.length ? externalEntries.join(' · ') : '无外部 ID · 必须人工确认';
    document.getElementById('metadata-output').className = 'media-output';
    document.getElementById('metadata-output').innerHTML = [
      '<div class="media-heading"><div><strong>' + escapeHtml(media.title) + '</strong><p>' + escapeHtml(media.original_title || metadata.providerLabel + ' 建档') + '</p></div>' + rating + '</div>',
      '<div class="media-meta"><span>' + media.year + '</span><span>' + escapeHtml(media.type.toUpperCase()) + '</span><span>' + (media.type === 'tv' ? '第 ' + media.season + ' 季' : currentScenario.externalSource ? '技术测试资产' : '电影') + '</span><span>' + (media.status === 'provisional' ? '待人工确认' : media.rating == null ? '无评分语义' : media.rating_count.toLocaleString('zh-CN') + ' 人评分') + '</span></div>',
      '<div class="tag-row">' + media.genres.map(function (genre) { return '<span>' + escapeHtml(genre) + '</span>'; }).join('') + '</div>',
      '<div class="identity-box"><small>内部身份 / ' + escapeHtml(metadata.providerLabel) + ' 证据</small><code>' + escapeHtml(media.id) + ' ← ' + escapeHtml(identityEvidence) + '</code></div>'
    ].join('');
  }

  function renderResources() {
    var resourceBundle = currentScenario.resource;
    derived.parsedResources = resourceBundle.resources.map(pipeline.parseAppleCmsResource);
    var candidates = derived.parsedResources.reduce(function (all, row) { return all.concat(row.candidates); }, []);
    var rejected = derived.parsedResources.reduce(function (all, row) { return all.concat(row.rejected); }, []);
    derived.allParsedCandidates = candidates;

    document.getElementById('resources-source').textContent = [
      resourceBundle.searchRequest,
      resourceBundle.detailRequest,
      '',
      resourceBundle.resources.length ? '已载入来源：' + resourceBundle.resources.map(function (item) { return item.source_name; }).join(' / ') : '搜索结果：0 个资源',
      resourceBundle.origin ? '上游域名：' + resourceBundle.origin.upstreamHost : '',
      resourceBundle.origin ? '允许路径：' + resourceBundle.origin.allowedPath : '',
      resourceBundle.origin ? '代理边界：' + resourceBundle.origin.proxyReason : ''
    ].filter(Boolean).join('\n');

    document.getElementById('resources-output').className = '';
    document.getElementById('resources-output').innerHTML = [
      '<div class="metric-row">',
      '<div class="metric-box"><strong>' + resourceBundle.resources.length + '</strong><span>资源响应</span></div>',
      '<div class="metric-box"><strong>' + candidates.length + '</strong><span>HLS 剧集候选</span></div>',
      '<div class="metric-box"><strong>' + rejected.length + '</strong><span>格式被过滤</span></div>',
      '</div>',
      '<div class="filter-note">' + (resourceBundle.origin ? '外部来源：Apple Developer 官方测试流；实时请求经固定域名与路径白名单代理。' : resourceBundle.resources.length ? '验证结果：资源只形成候选，不会自动证明内容正确或获得授权。' : '验证结果：元数据存在，但没有播放资源；系统必须明确返回不可播放状态。') + '</div>',
      '<div class="tag-row" style="margin-top:12px">' + candidates.map(function (item) { return '<span>' + escapeHtml(item.source_key) + ' · ' + escapeHtml(item.episode_key) + '</span>'; }).join('') + '</div>'
    ].join('');
  }

  function renderMatching() {
    if (!derived.media) renderMetadata();
    derived.matches = currentScenario.resource.resources.map(function (resource) {
      return { resource: resource, decision: pipeline.matchResource(derived.media, resource) };
    });

    document.getElementById('matching-source').innerHTML = [
      '<span>Media: ' + escapeHtml(derived.media.title) + ' · ' + derived.media.year + ' · season ' + derived.media.season + '</span>',
      '<span>Resources: ' + currentScenario.resource.resources.length + ' 个候选来源</span>'
    ].join('');

    document.getElementById('matching-output').className = 'match-list';
    document.getElementById('matching-output').innerHTML = derived.matches.length ? derived.matches.map(function (row) {
      var decision = row.decision;
      var accepted = decision.decision === 'auto_accept';
      var review = decision.decision === 'review';
      var details = accepted || review ? decision.evidence.join(' · ') : decision.conflicts.join(' · ');
      return '<div class="match-row">' +
        '<div><strong>' + escapeHtml(row.resource.source_name) + '</strong><small>' + escapeHtml(row.resource.vod_name) + ' · ' + escapeHtml(row.resource.vod_year) + '</small></div>' +
        '<div class="match-evidence">' + escapeHtml(decision.method) + '<br>' + escapeHtml(details) + '</div>' +
        '<span class="decision-pill ' + (accepted ? 'decision-accept' : review ? 'decision-review' : 'decision-reject') + '">' + (accepted ? '接受 ' + decision.confidence.toFixed(2) : review ? '复核 ' + decision.confidence.toFixed(2) : '拒绝') + '</span>' +
      '</div>';
    }).join('') : '<div class="search-empty"><strong>没有资源可匹配</strong><span>保留元数据目录，但不能进入播放候选。</span></div>';
  }

  function renderCandidates() {
    if (!derived.media) renderMetadata();
    derived.rankedCandidates = pipeline.rankCandidates(derived.media, currentScenario.targetEpisode, currentScenario.resource.resources);
    document.getElementById('candidate-list').innerHTML = derived.rankedCandidates.length ? derived.rankedCandidates.map(function (candidate, index) {
      return '<div class="candidate-row" data-candidate-id="' + escapeHtml(candidate.candidate_id) + '">' +
        '<span class="candidate-order">' + (index + 1) + '</span>' +
        '<div><strong>' + escapeHtml(candidate.source_name) + '</strong><small>' + escapeHtml(candidate.episode_key) + ' · confidence ' + candidate.match.confidence.toFixed(2) + (currentScenario.externalSource ? ' · Apple 官方外部 HLS' : candidate.url.indexOf('127.0.0.1:4174/hls/decodable-') >= 0 ? ' · 真实本地 HLS' : '') + '</small></div>' +
        '<span class="candidate-score">' + candidate.candidate_score.toFixed(3) + '</span>' +
      '</div>';
    }).join('') : '<p>' + (derived.media.status === 'provisional' ? '候选已隔离：等待人工确认媒体身份' : '没有可播放候选') + '</p>';
  }

  function drawStreamFrame(timestamp) {
    var canvas = document.getElementById('stream-canvas');
    var context = canvas.getContext('2d');
    if (!context) return;
    var t = reducedMotion ? 0 : timestamp / 1000;
    var gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#07101d');
    gradient.addColorStop(0.48, '#12355b');
    gradient.addColorStop(1, '#151729');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < 9; i += 1) {
      var x = (i * 137 + t * (18 + i * 2)) % (canvas.width + 180) - 90;
      var y = 90 + (i % 4) * 115 + Math.sin(t + i) * 28;
      context.beginPath();
      context.arc(x, y, 46 + (i % 3) * 20, 0, Math.PI * 2);
      context.fillStyle = 'rgba(' + (40 + i * 8) + ', ' + (108 + i * 5) + ', 178, 0.10)';
      context.fill();
    }

    context.fillStyle = 'rgba(255,255,255,0.055)';
    for (var line = 0; line < 14; line += 1) context.fillRect(0, line * 42 + (t * 8 % 42), canvas.width, 1);
    context.fillStyle = 'rgba(255,255,255,0.78)';
    context.font = '700 24px system-ui, sans-serif';
    context.fillText('LOCAL SAFE STREAM', 42, canvas.height - 66);
    context.fillStyle = 'rgba(255,255,255,0.42)';
    context.font = '16px ui-monospace, monospace';
    context.fillText(streamRoute + ' · S01E03', 42, canvas.height - 38);

    if (!reducedMotion) streamAnimation = window.requestAnimationFrame(drawStreamFrame);
  }

  function startSafeStream() {
    var canvas = document.getElementById('stream-canvas');
    var video = document.getElementById('safe-video');
    var fallback = document.getElementById('player-fallback');
    if (streamAnimation) window.cancelAnimationFrame(streamAnimation);
    drawStreamFrame(0);
    if (!reducedMotion) streamAnimation = window.requestAnimationFrame(drawStreamFrame);

    if (canvas.captureStream) {
      try {
        streamObject = canvas.captureStream(reducedMotion ? 1 : 24);
        video.srcObject = streamObject;
        video.play().catch(function () { fallback.hidden = false; });
        fallback.hidden = true;
      } catch (error) {
        fallback.hidden = false;
      }
    } else {
      fallback.hidden = false;
    }
  }

  function stopSafeStream() {
    if (streamAnimation) window.cancelAnimationFrame(streamAnimation);
    streamAnimation = null;
    if (streamObject && streamObject.getTracks) streamObject.getTracks().forEach(function (track) { track.stop(); });
    streamObject = null;
    var video = document.getElementById('safe-video');
    if (video) video.srcObject = null;
  }

  function formatTime(seconds) {
    var value = Math.max(0, Math.floor(Number(seconds) || 0));
    return String(Math.floor(value / 60)).padStart(2, '0') + ':' + String(value % 60).padStart(2, '0');
  }

  function eventClass(eventName) {
    if (eventName === 'fatal_error') return 'event-failure';
    if (eventName === 'source_switched') return 'event-switch';
    if (eventName === 'first_frame' || eventName === 'first_frame_recovered' || eventName === 'played_10s' || eventName === 'played_3s' || eventName === 'played_after_switch') return 'event-success';
    return '';
  }

  function appendEvent(event) {
    var log = document.getElementById('event-log');
    if (log.querySelector('.event-empty')) log.innerHTML = '';
    var item = document.createElement('li');
    item.className = eventClass(event.event);
    var detail = event.source || event.reason || '';
    if (event.event === 'source_switched') detail = '同集接管 · 进度保留';
    if (event.event === 'decoder_handoff') detail = (event.source || '') + ' · Hls.js 真实解码';
    if (event.event === 'first_frame_recovered') detail = (event.source || '') + ' · 恢复位置差 ' + Number(event.resume_delta || 0).toFixed(2) + 's';
    if (event.event === 'played_after_switch') detail = (event.source || '') + ' · 恢复后继续播放';
    if (event.elapsed_ms) detail += (detail ? ' · ' : '') + event.elapsed_ms + 'ms';
    item.innerHTML = '<strong>' + escapeHtml(event.event) + '</strong><span>' + escapeHtml(detail) + '</span>';
    log.appendChild(item);
  }

  function updatePlayerForEvent(event) {
    var shell = document.querySelector('.player-shell');
    var icon = document.getElementById('player-state-icon');
    var state = document.getElementById('player-state');
    var detail = document.getElementById('player-detail');
    var time = document.getElementById('player-time');
    var total = document.getElementById('player-duration');
    var bar = document.getElementById('player-progress-bar');
    var duration = Number(event.duration || 0);
    time.textContent = formatTime(event.position);
    if (duration > 0 && Number.isFinite(duration)) total.textContent = formatTime(duration);
    bar.style.width = duration > 0 ? Math.min(100, (Number(event.position || 0) / duration) * 100) + '%' : '0%';

    if (event.event === 'decoder_handoff' || event.event === 'attempt_started') {
      shell.classList.remove('is-error', 'is-success');
      streamRoute = event.source;
      icon.textContent = '◇';
      state.textContent = event.event === 'decoder_handoff' ? '真实 Hls.js 正在连接 ' + event.source : '正在连接 ' + event.source;
      detail.textContent = '匹配后的候选 · 同一 ' + currentScenario.targetEpisode.episode_key;
    } else if (event.event === 'fatal_error') {
      shell.classList.add('is-error');
      icon.textContent = '!';
      state.textContent = event.source + ' 播放中故障';
      detail.textContent = (event.reason || 'fatal_error') + ' · 寻找同集安全候选';
    } else if (event.event === 'source_switched') {
      shell.classList.remove('is-error');
      streamRoute = event.source;
      icon.textContent = '↻';
      state.textContent = '切换到 ' + event.source;
      detail.textContent = currentScenario.targetEpisode.media_unit_id + ' · 播放位置 ' + formatTime(event.position);
    } else if (event.event === 'manifest_loaded') {
      icon.textContent = '◌';
      state.textContent = 'HLS 清单已载入';
      detail.textContent = event.source + ' · ' + event.elapsed_ms + 'ms';
    } else if (event.event === 'first_frame') {
      shell.classList.add('is-success');
      icon.textContent = '▶';
      state.textContent = event.source + ' 已出现首帧';
      detail.textContent = event.real ? 'Hls.js + MSE 正在真实解码' : '换线成功，继续原来的第 3 集';
    } else if (event.event === 'first_frame_recovered') {
      shell.classList.add('is-success');
      icon.textContent = '▶';
      state.textContent = event.source + ' 已恢复真实首帧';
      detail.textContent = '位置差 ' + Number(event.resume_delta || 0).toFixed(2) + ' 秒 · 同一 ' + currentScenario.targetEpisode.episode_key;
    } else if (event.event === 'played_3s') {
      shell.classList.add('is-success');
      icon.textContent = '✓';
      state.textContent = '真实 HLS 连续播放超过 3 秒';
      detail.textContent = '清单、分片、解码、首帧和时间推进均已验证';
      var stableVerdict = document.getElementById('playback-verdict');
      stableVerdict.className = 'result-verdict is-pass';
      stableVerdict.textContent = currentScenario.externalSource ? '通过：Apple 官方外部 HLS 真实播放' : '通过：真实 HLS 稳定播放';
    } else if (event.event === 'played_after_switch') {
      shell.classList.add('is-success');
      icon.textContent = '✓';
      state.textContent = '换线后继续真实播放';
      detail.textContent = 'fatal_error → source_switched → first_frame_recovered';
      var failoverVerdict = document.getElementById('playback-verdict');
      failoverVerdict.className = 'result-verdict is-pass';
      failoverVerdict.textContent = '通过：真实 HLS 同集换线';
    } else if (event.event === 'played_10s') {
      shell.classList.add('is-success');
      icon.textContent = '✓';
      state.textContent = '连续播放 10 秒';
      detail.textContent = '记录成功，后续更新线路健康度';
      var verdict = document.getElementById('playback-verdict');
      verdict.className = 'result-verdict is-pass';
      verdict.textContent = currentScenario.expectedOutcome === 'failover' ? '通过：同集换线 + 进度保留' : '通过：候选稳定播放';
    }
  }

  function renderPlaybackTerminal(kind) {
    var shell = document.querySelector('.player-shell');
    var icon = document.getElementById('player-state-icon');
    var state = document.getElementById('player-state');
    var detail = document.getElementById('player-detail');
    var verdict = document.getElementById('playback-verdict');
    var log = document.getElementById('event-log');
    shell.classList.remove('is-error', 'is-success');
    shell.classList.add('is-error');
    icon.textContent = kind === 'manual_review' ? '?' : '∅';
    if (kind === 'manual_review') {
      state.textContent = '等待人工确认媒体身份';
      detail.textContent = '资源已发现，但 provisional Media 禁止自动播放';
      verdict.className = 'result-verdict is-review';
      verdict.textContent = '待复核：不进入自动播放';
      log.innerHTML = '<li class="event-switch"><strong>manual_review</strong><span>资源反向建档 · 候选隔离</span></li>';
    } else {
      state.textContent = '暂无视频资源';
      detail.textContent = '目录可以存在，但当前不可播放';
      verdict.className = 'result-verdict is-empty';
      verdict.textContent = '空状态：0 个播放候选';
      log.innerHTML = '<li><strong>no_candidates</strong><span>元数据保留 · 等待合法资源接入</span></li>';
    }
  }

  async function runStage(step, token) {
    setStatus(step, 'running', '处理中');
    announce('第 ' + step + ' 站开始运行');
    await wait(360, token);

    if (step === 1) renderMetadata();
    if (step === 2) renderResources();
    if (step === 3) renderMatching();
    if (step === 4) {
      renderCandidates();
      document.getElementById('player-unit').textContent = currentScenario.targetEpisode.episode_key + ' · ' + currentScenario.targetEpisode.label;
      if (currentScenario.expectedOutcome === 'manual_review' || currentScenario.expectedOutcome === 'no_resources') {
        await wait(280, token);
        renderPlaybackTerminal(currentScenario.expectedOutcome);
      } else {
        stopSafeStream();
        document.getElementById('player-fallback').hidden = true;
        document.getElementById('stream-status').textContent = currentScenario.externalSource ? 'APPLE OFFICIAL HLS · ALLOWLIST PROXY' : 'REAL HLS.JS STREAM';
        document.getElementById('event-log').innerHTML = '<li class="event-empty">匹配完成，正在把候选交给 Hls.js…</li>';
        document.getElementById('station-playback').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
        var candidateCount = currentScenario.expectedOutcome === 'failover' ? 2 : 1;
        derived.actualPlayback = await window.MoovieRealHlsLab.runScenario({
          video: document.getElementById('safe-video'),
          mode: currentScenario.expectedOutcome === 'failover' ? 'failover' : 'healthy',
          candidates: derived.rankedCandidates.slice(0, candidateCount),
          onEvent: function (event) {
            if (token !== runToken) return;
            appendEvent(event);
            updatePlayerForEvent(event);
          }
        });
      }
    }

    setStatus(step, 'success', '已验证');
    updateProgress(step);
    announce('第 ' + step + ' 站验证完成');
  }

  async function runThrough(targetStep, resetFirst) {
    if (running) return;
    if (resetFirst) resetLab(false);
    setBusy(true);
    var token = runToken;
    try {
      for (var step = 1; step <= targetStep; step += 1) {
        var status = document.querySelector('[data-status-for="' + step + '"]');
        if (status && status.classList.contains('status-success')) continue;
        await runStage(step, token);
      }
      if (targetStep === 4) {
        document.getElementById('station-playback').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
      }
    } catch (error) {
      if (error.message !== 'run_cancelled' && error.message !== 'scenario_cancelled') {
        window.__consoleErrors.push(String(error.stack || error));
        console.error(error);
      }
    } finally {
      if (token === runToken) setBusy(false);
    }
  }

  function resetLab(announceReset) {
    runToken += 1;
    setBusy(false);
    derived = {};
    if (window.MoovieRealHlsLab && window.MoovieRealHlsLab.stopScenario) window.MoovieRealHlsLab.stopScenario();
    stopSafeStream();
    streamRoute = 'SAFE FIXTURE STREAM';
    for (var step = 1; step <= 4; step += 1) setStatus(step, 'idle', '等待运行');
    document.querySelectorAll('[data-route-step]').forEach(function (button) { button.classList.remove('is-active', 'is-complete'); });
    progressBar.style.width = '0%';
    document.getElementById('metadata-source').textContent = '等待载入脱敏响应…';
    var metadataOutput = document.getElementById('metadata-output');
    metadataOutput.className = 'empty-result';
    metadataOutput.textContent = '运行后显示内部媒体身份、评分和外部 ID。';
    document.getElementById('resources-source').textContent = currentScenario.resource.searchRequest + '\n' + currentScenario.resource.detailRequest;
    var resourcesOutput = document.getElementById('resources-output');
    resourcesOutput.className = 'empty-result';
    resourcesOutput.textContent = '运行后显示资源数、HLS 候选和被过滤格式。';
    document.getElementById('matching-source').innerHTML = '<span>Media: ' + escapeHtml(currentScenario.title) + ' · 等待上一步</span><span>Resources: ' + currentScenario.resource.resources.length + '</span>';
    var matchingOutput = document.getElementById('matching-output');
    matchingOutput.className = 'empty-result';
    matchingOutput.textContent = '运行后显示自动接受、启发式接受和拒绝原因。';
    document.getElementById('candidate-list').innerHTML = '<p>等待匹配结果…</p>';
    document.getElementById('event-log').innerHTML = '<li class="event-empty">运行后观察匹配候选进入真实 Hls.js，以及线路 B 如何在同一集接管。</li>';
    document.getElementById('playback-verdict').className = 'result-verdict';
    document.getElementById('playback-verdict').textContent = '等待实验';
    document.querySelector('.player-shell').classList.remove('is-error', 'is-success');
    document.getElementById('player-state-icon').textContent = '◇';
    document.getElementById('player-state').textContent = '等待候选线路';
    document.getElementById('player-detail').textContent = '匹配完成后将候选交给真实 Hls.js';
    document.getElementById('player-unit').textContent = currentScenario.targetEpisode.episode_key + ' · ' + currentScenario.targetEpisode.label;
    document.getElementById('player-time').textContent = '00:00';
    document.getElementById('player-duration').textContent = '--:--';
    document.getElementById('player-progress-bar').style.width = '0%';
    document.getElementById('player-fallback').hidden = false;
    document.getElementById('stream-status').textContent = 'WAITING FOR MATCHED HLS';
    if (announceReset !== false) announce('实验已重置');
  }

  function providerChipClass(state) {
    if (state === 'hit') return 'provider-hit';
    if (state === 'miss') return 'provider-miss';
    if (state === 'review') return 'provider-review';
    return 'provider-unused';
  }

  function scenarioOutcomeLabel(scenario) {
    if (scenario.expectedOutcome === 'manual_review') return '待人工确认，禁止自动播放';
    if (scenario.expectedOutcome === 'no_resources') return '0 个播放资源';
    if (scenario.expectedOutcome === 'failover') return '可播放 · 真实本地 HLS 换线';
    if (scenario.expectedOutcome === 'external_success') return '可播放 · Apple 官方外部 HLS';
    return '可播放 · 真实本地 HLS';
  }

  function renderSearchResults(items, query) {
    if (!items.length) {
      searchResults.innerHTML = '<div class="search-empty"><strong>没有找到“' + escapeHtml(query) + '”</strong><span>这是离线研究数据。可尝试“豆瓣没有”“反向建档”或上方示例片名。</span></div>';
      return;
    }
    searchResults.innerHTML = items.map(function (scenario) {
      var chips = scenario.providerStates.map(function (state) {
        return '<span class="provider-chip ' + providerChipClass(state.state) + '">' + escapeHtml(state.provider) + ' <small>' + escapeHtml(state.label) + '</small></span>';
      }).join('');
      return '<article class="search-result-card ' + (scenario.id === currentScenario.id ? 'is-selected' : '') + '">' +
        '<div><div class="result-title-row"><h3>' + escapeHtml(scenario.title) + '</h3><span>' + escapeHtml(scenario.subtitle) + '</span></div>' +
        '<div class="provider-trace">' + chips + '</div>' +
        '<div class="result-resource">资源响应 ' + scenario.resource.resources.length + ' 个 · ' + escapeHtml(scenarioOutcomeLabel(scenario)) + '</div></div>' +
        '<button class="result-action" type="button" data-select-scenario="' + escapeHtml(scenario.id) + '">' + (scenario.id === currentScenario.id ? '重新运行' : '选择并运行') + '</button>' +
      '</article>';
    }).join('');
  }

  function updateScenarioContext() {
    document.getElementById('current-scenario-label').innerHTML = '<span aria-hidden="true">●</span> 当前示例：' + escapeHtml(currentScenario.title) + ' · ' + escapeHtml(currentScenario.subtitle);
    document.getElementById('summary-metadata').textContent = currentScenario.metadata.provider === 'douban' ? '豆瓣命中' : currentScenario.metadata.provider === 'tmdb' ? 'TMDB 回退' : '资源反向建档';
    document.getElementById('summary-resource-input').textContent = currentScenario.resource.resources.length + ' 个演示源';
    document.getElementById('summary-play-candidate').textContent = scenarioOutcomeLabel(currentScenario);
    document.getElementById('summary-risk').textContent = currentScenario.metadata.status === 'provisional' ? '待人工确认' : currentScenario.resource.resources.length ? '已确认' : '目录有、资源无';
    var activeQuery = String(searchInput.value || '').trim();
    renderSearchResults(activeQuery ? pipeline.searchScenarios(scenarios, activeQuery) : scenarios, activeQuery);
  }

  function selectScenario(scenarioId, runAfterSelect) {
    var selected = scenarios.find(function (scenario) { return scenario.id === scenarioId; });
    if (!selected || running) return;
    currentScenario = selected;
    resetLab(false);
    updateScenarioContext();
    searchFeedback.innerHTML = '已选择 <strong>' + escapeHtml(currentScenario.title) + '</strong>：' + escapeHtml(currentScenario.subtitle) + '。四站将使用该内容的数据。';
    announce('已选择 ' + currentScenario.title);
    if (runAfterSelect) runThrough(4, false);
  }

  function performSearch(query) {
    var value = String(query || '').trim();
    if (!value) {
      searchFeedback.textContent = '展示全部 4 个研究样例。输入片名或来源场景可缩小结果。';
      renderSearchResults(scenarios, '');
      return;
    }
    var results = pipeline.searchScenarios(scenarios, value);
    searchFeedback.innerHTML = results.length ? '找到 <strong>' + results.length + '</strong> 个研究样例。选择后会运行该条目的真实来源分支。' : '没有匹配结果；系统不会为未知内容伪造元数据或播放地址。';
    renderSearchResults(results, value);
  }

  function applyTheme(theme) {
    var isDark = theme === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeButton.setAttribute('aria-pressed', String(isDark));
    themeButton.setAttribute('aria-label', isDark ? '切换浅色主题' : '切换深色主题');
    themeLabel.textContent = isDark ? '浅色' : '深色';
    themeIcon.textContent = isDark ? '☼' : '◐';
    try { window.localStorage.setItem('moovie-lab-theme', isDark ? 'dark' : 'light'); } catch (error) {}
  }

  runAllButton.addEventListener('click', function () { runThrough(4, true); });
  resetButton.addEventListener('click', function () { resetLab(true); });
  searchForm.addEventListener('submit', function (event) {
    event.preventDefault();
    performSearch(searchInput.value);
  });
  searchClear.addEventListener('click', function () {
    searchInput.value = '';
    performSearch('');
    searchInput.focus();
  });
  document.querySelectorAll('[data-example-query]').forEach(function (button) {
    button.addEventListener('click', function () {
      searchInput.value = button.getAttribute('data-example-query');
      performSearch(searchInput.value);
      searchResults.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest' });
    });
  });
  searchResults.addEventListener('click', function (event) {
    var button = event.target.closest('[data-select-scenario]');
    if (button) selectScenario(button.getAttribute('data-select-scenario'), true);
  });
  document.querySelectorAll('[data-run-step]').forEach(function (button) {
    button.addEventListener('click', function () { runThrough(Number(button.getAttribute('data-run-step')), false); });
  });
  document.querySelectorAll('[data-jump]').forEach(function (button) {
    button.addEventListener('click', function () {
      var target = document.getElementById(button.getAttribute('data-jump'));
      if (target) target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });
  themeButton.addEventListener('click', function () {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  var storedTheme = null;
  try { storedTheme = window.localStorage.getItem('moovie-lab-theme'); } catch (error) {}
  if (!storedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) storedTheme = 'dark';
  applyTheme(storedTheme === 'dark' ? 'dark' : 'light');
  updateScenarioContext();
  performSearch('');
})();
