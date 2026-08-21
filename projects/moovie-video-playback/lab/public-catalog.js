(function () {
  'use strict';

  var API_BASE = 'http://127.0.0.1:4174/public-catalog/search';
  var providerLabels = {
    internet_archive: 'Internet Archive',
    wikimedia: 'Wikimedia Commons',
    loc: 'Library of Congress',
    nasa: 'NASA'
  };
  var form = document.getElementById('public-catalog-search');
  if (!form) return;

  var queryInput = document.getElementById('public-catalog-query');
  var providerSelect = document.getElementById('public-provider');
  var status = document.getElementById('public-catalog-status');
  var providerStatus = document.getElementById('public-provider-status');
  var results = document.getElementById('public-catalog-results');
  var video = document.getElementById('public-video');
  var placeholder = document.getElementById('public-video-placeholder');
  var playState = document.getElementById('public-play-state');
  var activeHls = null;
  var activeRequest = null;

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function stopVideo() {
    if (activeHls) activeHls.destroy();
    activeHls = null;
    video.pause();
    video.removeAttribute('src');
    video.load();
  }

  function setStatus(title, copy, tone) {
    status.className = 'public-catalog-status' + (tone ? ' is-' + tone : '');
    status.innerHTML = '<strong>' + escapeHtml(title) + '</strong><span>' + escapeHtml(copy) + '</span>';
  }

  function renderProviderStatus(entries) {
    providerStatus.innerHTML = (entries || []).map(function (entry) {
      var label = providerLabels[entry.provider] || entry.provider;
      var detail = entry.ok ? entry.count + ' 条' : (entry.error || '请求失败');
      return '<span class="' + (entry.ok ? 'is-ok' : 'is-error') + '"><b>' + escapeHtml(label) + '</b>' + escapeHtml(detail) + '</span>';
    }).join('');
  }

  function rightsLabel(item) {
    if (item.rightsStatus === 'review') return '需人工核权';
    if (item.rightsStatus === 'conditional') return '有条件使用';
    if (item.rightsStatus === 'open_with_attribution') return '开放 · 须署名';
    return '开放许可';
  }

  function renderResults(items) {
    if (!items.length) {
      results.innerHTML = '<div class="public-empty"><strong>没有通过本轮筛选的结果</strong><span>可能是无匹配项、来源暂时失败，或许可字段未通过开放许可白名单。</span></div>';
      return;
    }
    results.innerHTML = items.map(function (item, index) {
      var image = item.thumbnail ? '<img src="' + escapeHtml(item.thumbnail) + '" alt="" loading="lazy">' : '<span class="public-card-fallback" aria-hidden="true">FILM</span>';
      var reason = item.reason ? '<p class="public-card-reason">' + escapeHtml(item.reason) + '</p>' : '';
      return '<article class="public-result-card' + (item.playable ? '' : ' is-locked') + '" data-public-index="' + index + '">' +
        '<div class="public-card-media">' + image + '<span>' + escapeHtml(providerLabels[item.provider]) + '</span></div>' +
        '<div class="public-card-copy"><div class="public-card-topline"><span class="rights-pill rights-' + escapeHtml(item.rightsStatus) + '">' + escapeHtml(rightsLabel(item)) + '</span><small>' + escapeHtml(item.year || '年份未知') + '</small></div>' +
        '<h3>' + escapeHtml(item.title) + '</h3><p>' + escapeHtml(item.description || '官方接口未提供简介。') + '</p>' +
        '<dl><div><dt>创作者</dt><dd>' + escapeHtml(item.creator || '见项目页') + '</dd></div><div><dt>许可</dt><dd>' + escapeHtml(item.licenseName) + '</dd></div></dl>' + reason +
        '<button type="button" class="' + (item.playable ? 'primary-button' : 'secondary-button') + '" data-public-play="' + index + '">' + (item.playable ? '直接播放' : '查看禁播原因') + '</button></div></article>';
    }).join('');
    results.querySelectorAll('[data-public-play]').forEach(function (button) {
      button.addEventListener('click', function () { selectItem(items[Number(button.dataset.publicPlay)]); });
    });
  }

  function updateDetail(item) {
    document.getElementById('public-player-title').textContent = item.title;
    document.getElementById('public-player-description').textContent = item.description || '官方接口未提供简介。';
    document.getElementById('public-player-provider').textContent = providerLabels[item.provider] || item.provider;
    document.getElementById('public-player-license').textContent = item.licenseName || '未识别';
    document.getElementById('public-player-attribution').textContent = item.attribution || item.creator || '见项目页';
    document.getElementById('public-player-format').textContent = item.mimeType || '未提供';
    document.getElementById('public-player-rights').textContent = item.reason || '已通过自动许可闸门；实际再利用仍需遵守署名、相同方式共享等项目页条件。';
    var source = document.getElementById('public-player-source');
    source.href = item.sourcePage || item.licenseUrl || '#public-catalog-lab';
  }

  function selectItem(item) {
    stopVideo();
    updateDetail(item);
    document.getElementById('public-player').scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (!item.playable || !item.mediaUrl) {
      placeholder.hidden = false;
      placeholder.querySelector('strong').textContent = '版权闸门已阻止播放';
      placeholder.querySelector('small').textContent = item.reason || '请先在官方项目页完成逐条核权。';
      playState.textContent = 'RIGHTS REVIEW';
      playState.className = 'public-play-state is-review';
      return;
    }

    placeholder.hidden = true;
    playState.textContent = 'LOADING';
    playState.className = 'public-play-state is-loading';
    var isHls = /mpegurl/i.test(item.mimeType) || /\.m3u8(?:$|\?)/i.test(item.mediaUrl);
    if (isHls && window.Hls && window.Hls.isSupported()) {
      activeHls = new window.Hls({ enableWorker: true, maxBufferLength: 20 });
      activeHls.loadSource(item.mediaUrl);
      activeHls.attachMedia(video);
      activeHls.on(window.Hls.Events.ERROR, function (_event, data) {
        if (data.fatal) {
          playState.textContent = 'PLAYBACK ERROR';
          playState.className = 'public-play-state is-error';
        }
      });
    } else {
      video.src = item.mediaUrl;
    }
    video.play().catch(function () {
      playState.textContent = '点击播放器开始';
      playState.className = 'public-play-state is-review';
    });
  }

  video.addEventListener('loadedmetadata', function () {
    playState.textContent = (video.videoWidth || '—') + '×' + (video.videoHeight || '—') + ' · READY';
    playState.className = 'public-play-state is-ready';
  });
  video.addEventListener('playing', function () {
    playState.textContent = 'PLAYING · ' + video.currentTime.toFixed(1) + 's';
    playState.className = 'public-play-state is-ready';
  });
  video.addEventListener('timeupdate', function () {
    if (!video.paused) playState.textContent = 'PLAYING · ' + video.currentTime.toFixed(1) + 's';
  });
  video.addEventListener('error', function () {
    playState.textContent = 'MEDIA ERROR';
    playState.className = 'public-play-state is-error';
  });

  async function runSearch() {
    var query = queryInput.value.trim();
    if (query.length < 2) {
      setStatus('请输入至少两个字符', '可以尝试 Big Buck Bunny、Sintel 或 Apollo 11。', 'error');
      queryInput.focus();
      return;
    }
    if (activeRequest) activeRequest.abort();
    activeRequest = new AbortController();
    stopVideo();
    placeholder.hidden = false;
    placeholder.querySelector('strong').textContent = '选择“可播放”结果';
    placeholder.querySelector('small').textContent = '播放器支持 MP4、WebM，以及有明确权利声明的 HLS。';
    results.innerHTML = '<div class="public-loading"><i></i><strong>正在请求官方 API</strong><span>四个来源速度不同，最长等待约 15 秒。</span></div>';
    providerStatus.innerHTML = '';
    setStatus('真实搜索进行中', '正在校验来源响应、许可字段和浏览器可播放格式。', 'loading');
    var url = API_BASE + '?q=' + encodeURIComponent(query) + '&provider=' + encodeURIComponent(providerSelect.value);
    try {
      var response = await fetch(url, { signal: activeRequest.signal });
      var payload = await response.json();
      if (!response.ok) throw new Error(payload.msg || 'search_failed');
      renderProviderStatus(payload.providers);
      renderResults(payload.results);
      var playableCount = payload.results.filter(function (item) { return item.playable; }).length;
      setStatus('搜索完成 · ' + payload.results.length + ' 条', playableCount + ' 条通过当前版权与格式闸门，可直接播放；其余只显示来源与原因。', 'success');
    } catch (error) {
      if (error.name === 'AbortError') return;
      results.innerHTML = '<div class="public-empty"><strong>公开目录请求失败</strong><span>' + escapeHtml(error.message) + '</span></div>';
      setStatus('搜索失败', '请确认 4174 网关已运行且网络可访问官方 API。', 'error');
    }
  }

  form.addEventListener('submit', function (event) { event.preventDefault(); runSearch(); });
  document.querySelectorAll('[data-public-query]').forEach(function (button) {
    button.addEventListener('click', function () {
      queryInput.value = button.dataset.publicQuery;
      providerSelect.value = button.dataset.publicQuery === 'Apollo 11' ? 'nasa' : (button.dataset.publicQuery === 'silent film' ? 'loc' : 'all');
      runSearch();
    });
  });
  window.MooviePublicCatalog = { search: runSearch, stop: stopVideo };
}());
