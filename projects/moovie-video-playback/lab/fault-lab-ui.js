(function () {
  'use strict';

  var api = window.MoovieFaultLab;
  var baseUrl = 'http://127.0.0.1:4174';
  var selectedFault = 'healthy';
  var selectedHls = 'healthy';
  var running = false;
  var breaker = new api.CircuitBreaker({ failureThreshold: 3, coolDownMs: 1200 });
  var sourceLog = [];
  var hlsLog = [];

  var serverState = document.getElementById('fault-server-state');
  var sourceResult = document.getElementById('source-probe-result');
  var sourceLogElement = document.getElementById('source-probe-log');
  var circuitState = document.getElementById('circuit-state');
  var circuitFailures = document.getElementById('circuit-failures');
  var hlsResult = document.getElementById('hls-probe-result');
  var hlsLogElement = document.getElementById('hls-probe-log');
  var runSourceButton = document.getElementById('run-source-probe');
  var runBreakerButton = document.getElementById('run-breaker-demo');
  var resetButton = document.getElementById('reset-fault-probe');
  var runHlsButton = document.getElementById('run-hls-probe');

  var kindLabels = {
    success: 'AppleCMS 响应有效',
    rate_limited: 'HTTP 429 · 来源限流',
    http_error: 'HTTP 服务器错误',
    invalid_json: '200 但响应不可解析',
    timeout: '超过 650 ms · 主动取消',
    network_error: '本地服务不可达',
    circuit_open: '线路已熔断 · 本次未发请求',
    transport_success: '清单与首分片传输成功',
    manifest_error: 'HLS 清单请求失败',
    invalid_manifest: '响应不是有效 HLS 清单',
    no_segments: '清单没有媒体分片',
    segment_error: '清单成功，但首分片失败'
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function wait(ms) {
    return new Promise(function (resolve) { window.setTimeout(resolve, ms); });
  }

  function setRunning(value) {
    running = value;
    [runSourceButton, runBreakerButton, resetButton, runHlsButton].forEach(function (button) { button.disabled = value; });
    document.querySelectorAll('[data-fault-mode], [data-hls-mode]').forEach(function (button) { button.disabled = value; });
  }

  function renderCircuit() {
    var snapshot = breaker.snapshot();
    circuitState.textContent = snapshot.state.toUpperCase();
    circuitState.className = 'circuit-' + snapshot.state;
    circuitFailures.textContent = snapshot.failures + ' / ' + snapshot.threshold;
  }

  function renderLog(element, items) {
    element.innerHTML = items.map(function (item) {
      return '<li class="log-' + escapeHtml(item.tone || 'neutral') + '"><span>' + escapeHtml(item.label) + '</span><strong>' + escapeHtml(item.detail) + '</strong></li>';
    }).join('');
  }

  function addSourceEvent(label, detail, tone) {
    sourceLog.push({ label: label, detail: detail, tone: tone });
    renderLog(sourceLogElement, sourceLog.slice(-8));
  }

  function addHlsEvent(label, detail, tone) {
    hlsLog.push({ label: label, detail: detail, tone: tone });
    renderLog(hlsLogElement, hlsLog.slice(-8));
  }

  function requestUrl(mode) {
    return baseUrl + '/api.php/provide/vod?ac=videolist&wd=' + encodeURIComponent('雾港档案') + '&mode=' + encodeURIComponent(mode);
  }

  async function requestMode(mode) {
    var result = await api.requestAppleCms({
      url: requestUrl(mode),
      timeoutMs: 650,
      breaker: breaker
    });
    var status = result.status == null ? '—' : result.status;
    var label = kindLabels[result.kind] || result.kind;
    var detail = 'status ' + status + ' · ' + result.durationMs + ' ms';
    if (result.kind === 'circuit_open') detail = '未发出网络请求 · ' + result.retryAfterMs + ' ms 后可探测';
    if (result.ok) detail += ' · ' + result.itemCount + ' 条资源';
    if (result.circuitStateAtStart === 'half_open') addSourceEvent('HALF-OPEN', '冷却完成，允许 1 次健康探测', 'warning');
    addSourceEvent(result.ok ? 'PASS' : 'FAIL', label + ' · ' + detail, result.ok ? 'success' : 'danger');
    sourceResult.className = 'probe-result ' + (result.ok ? 'is-pass' : 'is-fail');
    sourceResult.innerHTML = '<strong>' + escapeHtml(label) + '</strong><span>' + escapeHtml(detail) + '</span>';
    renderCircuit();
    return result;
  }

  async function runSelectedSource() {
    if (running) return;
    setRunning(true);
    sourceResult.className = 'probe-result is-running';
    sourceResult.innerHTML = '<strong>请求中</strong><span>fetch → 4174 本地假 AppleCMS</span>';
    try {
      await requestMode(selectedFault);
    } finally {
      setRunning(false);
    }
  }

  async function runBreakerDemo() {
    if (running) return;
    setRunning(true);
    breaker.reset();
    sourceLog = [];
    renderCircuit();
    sourceResult.className = 'probe-result is-running';
    sourceResult.innerHTML = '<strong>自动序列运行中</strong><span>3 × HTTP 500 → 阻断 → 冷却 → 健康探测</span>';
    try {
      for (var index = 1; index <= 3; index += 1) {
        addSourceEvent('REQUEST ' + index, '向同一来源发送请求', 'neutral');
        await requestMode('server_error');
        await wait(100);
      }
      addSourceEvent('OPEN', '达到 3 次连续失败，线路进入熔断', 'danger');
      await requestMode('healthy');
      addSourceEvent('COOLDOWN', '实验冷却 1.2 秒；生产值应更长', 'warning');
      await wait(1300);
      var recovered = await requestMode('healthy');
      if (recovered.ok) addSourceEvent('CLOSED', '健康探测通过，线路恢复接流量', 'success');
      sourceResult.className = 'probe-result is-pass';
      sourceResult.innerHTML = '<strong>熔断恢复闭环完成</strong><span>CLOSED → OPEN → HALF-OPEN → CLOSED；熔断期间请求被本地阻断。</span>';
      renderCircuit();
    } finally {
      setRunning(false);
    }
  }

  function hlsUrl(mode) {
    return baseUrl + '/hls/' + mode + '/index.m3u8';
  }

  async function runHlsProbe() {
    if (running) return;
    setRunning(true);
    hlsLog = [];
    hlsResult.className = 'probe-result is-running';
    hlsResult.innerHTML = '<strong>探测中</strong><span>先取清单，再取首分片。</span>';
    try {
      var urls = selectedHls === 'failover'
        ? [hlsUrl('segment-error'), hlsUrl('healthy')]
        : [hlsUrl(selectedHls)];
      var result = await api.probeHlsCandidates({ manifestUrls: urls, timeoutMs: 900 });
      result.attempts.forEach(function (attempt) {
        var probe = attempt.result;
        addHlsEvent('线路 ' + attempt.line, (kindLabels[probe.kind] || probe.kind) + ' · ' + probe.durationMs + ' ms', probe.ok ? 'success' : 'danger');
        if (!probe.ok && attempt.line < urls.length) addHlsEvent('SWITCH', '保持同一 MediaUnit，尝试下一线路', 'warning');
      });
      if (result.ok) {
        var success = result.result;
        hlsResult.className = 'probe-result is-pass';
        hlsResult.innerHTML = '<strong>线路 ' + result.selectedLine + ' 传输通过</strong><span>manifest ' + success.manifestStatus + ' · segment ' + success.segmentStatus + ' · ' + success.segmentBytes + ' bytes；尚未验证解码。</span>';
      } else {
        hlsResult.className = 'probe-result is-fail';
        hlsResult.innerHTML = '<strong>' + escapeHtml(kindLabels[result.result.kind] || result.result.kind) + '</strong><span>该故障层已被准确识别，没有把失败线路标为可播放。</span>';
      }
    } finally {
      setRunning(false);
    }
  }

  function resetSource() {
    if (running) return;
    breaker.reset();
    sourceLog = [{ label: 'RESET', detail: '熔断器恢复 CLOSED，失败计数清零', tone: 'neutral' }];
    renderLog(sourceLogElement, sourceLog);
    sourceResult.className = 'probe-result';
    sourceResult.innerHTML = '<strong>等待请求</strong><span>将显示 HTTP 状态、耗时和故障分类。</span>';
    renderCircuit();
  }

  async function checkServer() {
    try {
      var response = await fetch(baseUrl + '/health', { cache: 'no-store' });
      if (!response.ok) throw new Error('health_' + response.status);
      serverState.className = 'server-state is-online';
      serverState.innerHTML = '<span aria-hidden="true"></span><strong>4174 本地假源在线</strong>';
    } catch (error) {
      serverState.className = 'server-state is-offline';
      serverState.innerHTML = '<span aria-hidden="true"></span><strong>4174 未启动 · 按 README 启动</strong>';
    }
  }

  document.querySelectorAll('[data-fault-mode]').forEach(function (button) {
    button.addEventListener('click', function () {
      selectedFault = button.getAttribute('data-fault-mode');
      document.querySelectorAll('[data-fault-mode]').forEach(function (item) { item.classList.toggle('is-selected', item === button); });
    });
  });
  document.querySelectorAll('[data-hls-mode]').forEach(function (button) {
    button.addEventListener('click', function () {
      selectedHls = button.getAttribute('data-hls-mode');
      document.querySelectorAll('[data-hls-mode]').forEach(function (item) { item.classList.toggle('is-selected', item === button); });
    });
  });
  runSourceButton.addEventListener('click', runSelectedSource);
  runBreakerButton.addEventListener('click', runBreakerDemo);
  resetButton.addEventListener('click', resetSource);
  runHlsButton.addEventListener('click', runHlsProbe);

  renderCircuit();
  checkServer();
})();
