(function () {
  'use strict';

  var baseUrl = 'http://127.0.0.1:4174/hls/';
  var video = document.getElementById('real-hls-video');
  var runHealthyButton = document.getElementById('run-real-hls');
  var runFailoverButton = document.getElementById('run-real-hls-failover');
  var stopButton = document.getElementById('stop-real-hls');
  var resultElement = document.getElementById('real-hls-result');
  var logElement = document.getElementById('real-hls-log');
  var badge = document.getElementById('decode-badge');
  var lineElement = document.getElementById('real-hls-line');
  var timeElement = document.getElementById('real-hls-time');
  var firstFrameElement = document.getElementById('real-hls-first-frame');
  var resumeElement = document.getElementById('real-hls-resume');

  var hls = null;
  var runId = 0;
  var mode = 'idle';
  var line = null;
  var startedAt = 0;
  var savedTime = 0;
  var pendingResume = 0;
  var firstFrameRecorded = false;
  var recoveredFrameRecorded = false;
  var playedMilestoneRecorded = false;
  var switching = false;
  var events = [];

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function addEvent(label, detail, tone) {
    events.push({ label: label, detail: detail, tone: tone || 'neutral' });
    logElement.innerHTML = events.slice(-7).map(function (item) {
      return '<li class="log-' + escapeHtml(item.tone) + '"><span>' + escapeHtml(item.label) + '</span><strong>' + escapeHtml(item.detail) + '</strong></li>';
    }).join('');
  }

  function setResult(title, detail, state) {
    resultElement.className = 'probe-result' + (state ? ' is-' + state : '');
    resultElement.innerHTML = '<strong>' + escapeHtml(title) + '</strong><span>' + escapeHtml(detail) + '</span>';
  }

  function setBusy(value) {
    runHealthyButton.disabled = value;
    runFailoverButton.disabled = value;
  }

  function destroyHls() {
    if (hls) {
      hls.destroy();
      hls = null;
    }
  }

  function resetPlayback() {
    runId += 1;
    destroyHls();
    video.pause();
    video.removeAttribute('src');
    video.load();
    mode = 'idle';
    line = null;
    startedAt = 0;
    savedTime = 0;
    pendingResume = 0;
    firstFrameRecorded = false;
    recoveredFrameRecorded = false;
    playedMilestoneRecorded = false;
    switching = false;
    events = [];
    lineElement.textContent = '—';
    timeElement.textContent = '0.00 s';
    firstFrameElement.textContent = '—';
    resumeElement.textContent = '—';
    badge.className = 'decode-badge';
    badge.textContent = 'HLS.JS · 等待运行';
    setBusy(false);
  }

  function failUnsupported() {
    setResult('当前浏览器不支持 HLS 解码', 'Hls.js 需要 Media Source Extensions；传输探针仍可使用。', 'fail');
    badge.textContent = 'MSE 不可用';
    addEvent('UNSUPPORTED', 'Hls.isSupported() 返回 false', 'danger');
    setBusy(false);
  }

  function loadLine(targetLine, url, resumeAt, token) {
    if (token !== runId) return;
    destroyHls();
    line = targetLine;
    pendingResume = resumeAt || 0;
    lineElement.textContent = '线路 ' + targetLine;
    badge.textContent = 'HLS.JS · 线路 ' + targetLine + ' 加载中';
    badge.className = 'decode-badge' + (targetLine === 'B' ? ' is-switching' : '');
    addEvent('ATTEMPT', '线路 ' + targetLine + ' · ' + url.split('/').slice(-2).join('/'), 'neutral');

    hls = new Hls({
      enableWorker: false,
      maxBufferLength: 4,
      maxMaxBufferLength: 6,
      backBufferLength: 4,
      manifestLoadingMaxRetry: 0,
      levelLoadingMaxRetry: 0,
      fragLoadingMaxRetry: 0
    });

    hls.on(Hls.Events.MEDIA_ATTACHED, function () {
      if (token === runId && hls) hls.loadSource(url);
    });

    hls.on(Hls.Events.MANIFEST_PARSED, function () {
      if (token !== runId) return;
      addEvent('MANIFEST', '线路 ' + targetLine + ' 清单解析完成', 'success');
      if (pendingResume > 0) {
        try { video.currentTime = pendingResume; } catch (error) {}
        addEvent('SEEK', '请求恢复到 ' + pendingResume.toFixed(2) + ' s', 'warning');
      }
      video.play().catch(function () {
        setResult('等待用户播放', '浏览器阻止自动播放；可使用视频控制条继续。', 'fail');
        setBusy(false);
      });
    });

    hls.on(Hls.Events.ERROR, function (event, data) {
      if (token !== runId || !data || !data.fatal) return;
      var detail = String(data.details || data.type || 'hls_fatal_error');
      if (mode === 'failover' && targetLine === 'A' && !switching) {
        switching = true;
        savedTime = Math.max(0, video.currentTime || 0);
        addEvent('FATAL_ERROR', '线路 A · ' + detail + ' · ' + savedTime.toFixed(2) + ' s', 'danger');
        addEvent('SOURCE_SWITCHED', '保持同一测试内容，切到线路 B', 'warning');
        resumeElement.textContent = savedTime.toFixed(2) + ' s → …';
        badge.className = 'decode-badge is-switching';
        badge.textContent = 'HLS.JS · A 失败，切换 B';
        setResult('线路 A 播放中故障', '正在重建 Hls.js，并在健康线路 B 恢复进度。', 'running');
        window.setTimeout(function () {
          if (token === runId) loadLine('B', baseUrl + 'decodable-healthy/index.m3u8', savedTime, token);
        }, 80);
        return;
      }
      addEvent('FATAL_ERROR', '线路 ' + targetLine + ' · ' + detail, 'danger');
      setResult('HLS 播放失败', '没有可用候选线路：' + detail, 'fail');
      badge.textContent = 'HLS.JS · 致命错误';
      setBusy(false);
    });

    hls.attachMedia(video);
  }

  function startPlayback(nextMode) {
    resetPlayback();
    mode = nextMode;
    runId += 1;
    var token = runId;
    startedAt = performance.now();
    setBusy(true);
    setResult('正在初始化 Hls.js', nextMode === 'failover' ? '线路 A 将在中段分片失败，随后切换 B。' : '加载健康 VOD 并等待真实首帧。', 'running');
    if (typeof Hls === 'undefined' || !Hls.isSupported()) return failUnsupported();
    addEvent('INITIALIZED', 'Hls.js ' + Hls.version + ' · MSE available', 'neutral');
    loadLine('A', baseUrl + (nextMode === 'failover' ? 'decodable-faulty' : 'decodable-healthy') + '/index.m3u8', 0, token);
  }

  video.addEventListener('playing', function () {
    if (mode === 'idle') return;
    badge.className = 'decode-badge is-playing';
    badge.textContent = 'HLS.JS · 线路 ' + line + ' 正在解码';
    if (line === 'A' && !firstFrameRecorded) {
      firstFrameRecorded = true;
      var firstFrameMs = Math.round(performance.now() - startedAt);
      firstFrameElement.textContent = firstFrameMs + ' ms';
      addEvent('FIRST_FRAME', '线路 A · ' + firstFrameMs + ' ms', 'success');
      setResult('真实首帧已显示', '视频由 Hls.js + MSE 解码，currentTime 正在推进。', 'pass');
    } else if (line === 'B' && !recoveredFrameRecorded) {
      recoveredFrameRecorded = true;
      var difference = Math.abs((video.currentTime || 0) - savedTime);
      resumeElement.textContent = savedTime.toFixed(2) + ' s → ' + (video.currentTime || 0).toFixed(2) + ' s';
      addEvent('FIRST_FRAME_RECOVERED', '线路 B · 位置差 ' + difference.toFixed(2) + ' s', 'success');
      setResult('线路 B 已恢复真实播放', '从线路 A 的故障位置附近继续解码。', 'pass');
    }
  });

  video.addEventListener('timeupdate', function () {
    var current = video.currentTime || 0;
    timeElement.textContent = current.toFixed(2) + ' s';
    if (mode === 'healthy' && !playedMilestoneRecorded && current >= 3) {
      playedMilestoneRecorded = true;
      addEvent('PLAYED_3S', '健康线路连续解码超过 3 秒', 'success');
      setResult('真实 HLS 连续播放通过', '清单、分片、解码、首帧和时间推进均已验证。', 'pass');
      setBusy(false);
    }
    if (mode === 'failover' && line === 'B' && recoveredFrameRecorded && !playedMilestoneRecorded && current >= savedTime + 1.5) {
      playedMilestoneRecorded = true;
      addEvent('PLAYED_AFTER_SWITCH', '线路 B 恢复后继续播放 1.5 秒', 'success');
      setResult('真实解码换线闭环通过', 'fatal_error → source_switched → first_frame_recovered → played_after_switch', 'pass');
      setBusy(false);
    }
  });

  video.addEventListener('ended', function () {
    if (mode !== 'idle') addEvent('ENDED', '本地 12 秒 VOD 播放结束', 'success');
    setBusy(false);
  });

  runHealthyButton.addEventListener('click', function () { startPlayback('healthy'); });
  runFailoverButton.addEventListener('click', function () { startPlayback('failover'); });
  stopButton.addEventListener('click', function () {
    resetPlayback();
    setResult('已停止', 'Hls.js 实例和媒体缓冲已释放。', '');
    addEvent('STOPPED', '播放器已重置', 'neutral');
  });

  var scenarioSession = null;
  var scenarioSequence = 0;

  function stopScenario() {
    var session = scenarioSession;
    scenarioSession = null;
    if (!session) return;
    session.cancelled = true;
    if (session.hls) session.hls.destroy();
    session.listeners.forEach(function (entry) { session.video.removeEventListener(entry[0], entry[1]); });
    session.video.pause();
    session.video.removeAttribute('src');
    session.video.load();
    if (!session.settled) {
      session.settled = true;
      session.reject(new Error('scenario_cancelled'));
    }
  }

  function runScenario(options) {
    options = options || {};
    stopScenario();
    if (typeof Hls === 'undefined' || !Hls.isSupported()) return Promise.reject(new Error('hls_not_supported'));
    if (!options.video || !Array.isArray(options.candidates) || !options.candidates.length) return Promise.reject(new Error('scenario_candidates_missing'));
    if (options.mode === 'failover' && options.candidates.length < 2) return Promise.reject(new Error('scenario_failover_candidate_missing'));

    return new Promise(function (resolve, reject) {
      var session = {
        id: ++scenarioSequence,
        video: options.video,
        candidates: options.candidates,
        mode: options.mode === 'failover' ? 'failover' : 'healthy',
        hls: null,
        currentIndex: 0,
        startedAt: performance.now(),
        savedTime: 0,
        firstFrame: false,
        recoveredFrame: false,
        milestone: false,
        switching: false,
        settled: false,
        cancelled: false,
        listeners: [],
        resolve: resolve,
        reject: reject
      };
      scenarioSession = session;

      function emit(eventName, detail) {
        var candidate = session.candidates[session.currentIndex] || {};
        var payload = Object.assign({
          event: eventName,
          source: candidate.source_name || ('线路 ' + (session.currentIndex + 1)),
          candidate_id: candidate.candidate_id || '',
          position: session.video.currentTime || 0,
          duration: Number.isFinite(session.video.duration) ? session.video.duration : 0,
          elapsed_ms: Math.round(performance.now() - session.startedAt),
          real: true
        }, detail || {});
        if (typeof options.onEvent === 'function') options.onEvent(payload);
        return payload;
      }

      function finish(payload) {
        if (session.settled || session.cancelled) return;
        session.settled = true;
        if (typeof options.onComplete === 'function') options.onComplete(payload);
        resolve(payload);
      }

      function fail(error) {
        if (session.settled || session.cancelled) return;
        session.settled = true;
        reject(error instanceof Error ? error : new Error(String(error)));
      }

      function loadCandidate(index, resumeAt) {
        if (session.cancelled) return;
        if (session.hls) session.hls.destroy();
        session.currentIndex = index;
        var candidate = session.candidates[index];
        var localHls = new Hls({
          enableWorker: false,
          maxBufferLength: 4,
          maxMaxBufferLength: 6,
          backBufferLength: 4,
          manifestLoadingMaxRetry: 0,
          levelLoadingMaxRetry: 0,
          fragLoadingMaxRetry: 0
        });
        session.hls = localHls;
        emit(index === 0 ? 'decoder_handoff' : 'attempt_started', { position: resumeAt || 0 });
        localHls.on(Hls.Events.MEDIA_ATTACHED, function () {
          if (!session.cancelled && localHls === session.hls) localHls.loadSource(candidate.url);
        });
        localHls.on(Hls.Events.MANIFEST_PARSED, function () {
          if (session.cancelled || localHls !== session.hls) return;
          emit('manifest_loaded');
          if (resumeAt > 0) {
            try { session.video.currentTime = resumeAt; } catch (error) {}
          }
          session.video.play().catch(fail);
        });
        localHls.on(Hls.Events.ERROR, function (event, data) {
          if (session.cancelled || localHls !== session.hls || !data || !data.fatal) return;
          var reason = String(data.details || data.type || 'hls_fatal_error');
          if (session.mode === 'failover' && index === 0 && !session.switching) {
            session.switching = true;
            session.savedTime = Math.max(0, session.video.currentTime || 0);
            emit('fatal_error', { reason: reason, position: session.savedTime });
            session.currentIndex = 1;
            emit('source_switched', {
              source: session.candidates[1].source_name,
              candidate_id: session.candidates[1].candidate_id,
              position: session.savedTime,
              preserved: true
            });
            window.setTimeout(function () { loadCandidate(1, session.savedTime); }, 80);
            return;
          }
          emit('fatal_error', { reason: reason });
          fail(new Error(reason));
        });
        localHls.attachMedia(session.video);
      }

      function onPlaying() {
        if (session.cancelled) return;
        if (session.currentIndex === 0 && !session.firstFrame) {
          session.firstFrame = true;
          emit('first_frame');
        } else if (session.currentIndex === 1 && !session.recoveredFrame) {
          session.recoveredFrame = true;
          emit('first_frame_recovered', {
            resume_from: session.savedTime,
            resume_delta: Math.abs((session.video.currentTime || 0) - session.savedTime)
          });
        }
      }

      function onTimeUpdate() {
        var current = session.video.currentTime || 0;
        if (session.mode === 'healthy' && !session.milestone && current >= 3) {
          session.milestone = true;
          var healthyEvent = emit('played_3s');
          finish({ ok: true, mode: 'healthy', line: 1, currentTime: current, event: healthyEvent });
        }
        if (session.mode === 'failover' && session.currentIndex === 1 && session.recoveredFrame && !session.milestone && current >= session.savedTime + 1.5) {
          session.milestone = true;
          var failoverEvent = emit('played_after_switch', { resume_from: session.savedTime });
          finish({ ok: true, mode: 'failover', line: 2, currentTime: current, savedTime: session.savedTime, event: failoverEvent });
        }
      }

      session.listeners = [['playing', onPlaying], ['timeupdate', onTimeUpdate]];
      session.listeners.forEach(function (entry) { session.video.addEventListener(entry[0], entry[1]); });
      session.video.srcObject = null;
      session.video.muted = true;
      loadCandidate(0, 0);
    });
  }

  window.MoovieRealHlsLab = {
    snapshot: function () {
      return { mode: mode, line: line, currentTime: video.currentTime || 0, savedTime: savedTime, events: events.slice() };
    },
    runScenario: runScenario,
    stopScenario: stopScenario
  };
})();
