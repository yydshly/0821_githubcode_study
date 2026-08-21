(function () {
  'use strict';

  var query = new URLSearchParams(window.location.search);
  var isStaticArchive = window.location.hostname.endsWith('github.io') || query.get('runtime') === 'pages';

  window.MoovieLabRuntime = {
    mode: isStaticArchive ? 'static-pages' : 'local-enhanced',
    isStaticArchive: isStaticArchive,
    gatewayBase: 'http://127.0.0.1:4174',
    healthyHlsUrl: './media/hls/index.m3u8',
    faultyHlsUrl: './media/hls-faulty/index.m3u8',
    resolveHlsUrl: function (url) {
      if (!isStaticArchive) return url;
      if (/\/hls\/decodable-faulty\/index\.m3u8(?:$|\?)/.test(url)) return './media/hls-faulty/index.m3u8';
      if (/\/hls\/decodable-healthy\/index\.m3u8(?:$|\?)/.test(url)) return './media/hls/index.m3u8';
      return url;
    }
  };

  if (!isStaticArchive) return;
  document.documentElement.dataset.runtime = 'static-pages';
  var banner = document.getElementById('runtime-mode-banner');
  if (banner) banner.hidden = false;
  var analysisLink = document.getElementById('analysis-link');
  if (analysisLink) analysisLink.href = '../moovie-source-research/';
}());
