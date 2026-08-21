(function (root, factory) {
  var fixtures = factory();
  if (typeof module === 'object' && module.exports) module.exports = fixtures;
  if (root) root.MoovieFixtures = fixtures;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var notice = '脱敏研究样本：字段形状参考上游实现，不代表豆瓣、TMDB 或任何资源站实时返回。';

  var harbor = {
    id: 'harbor-files', title: '雾港档案', subtitle: '豆瓣命中 · 双线路换线',
    keywords: ['雾港', '档案', '豆瓣', '换线', '电视剧'],
    metadata: {
      provider: 'douban', providerLabel: '豆瓣', status: 'confirmed',
      endpoint: 'https://m.douban.com/rexxar/api/v2/tv/demo-35700001', externalId: 'demo-35700001', internalId: 'media-demo-001',
      response: {
        id: 'demo-35700001', title: '雾港档案', original_title: 'Harbor Files', year: '2026',
        intro: '一组调查员追踪港口信号异常的研究样例剧集。', cover_url: 'fixture://poster/harbor-files',
        genres: ['悬疑', '剧情'], countries: ['中国大陆'], rating: { value: 8.3, count: 12840 },
        directors: [{ name: '示例导演' }], actors: [{ name: '示例演员甲' }, { name: '示例演员乙' }], type: 'tv', season: 1
      },
      reviewsEndpoint: 'https://m.douban.com/rexxar/api/v2/tv/demo-35700001/interests?count=10&order_by=hot',
      reviews: [
        { user: '研究用户 A', rating: 4, comment: '节奏稳定，第三集的信息密度很高。' },
        { user: '研究用户 B', rating: 5, comment: '视听设计有辨识度。' }
      ]
    },
    providerStates: [
      { provider: '豆瓣', state: 'hit', label: '命中详情与评分' },
      { provider: 'TMDB', state: 'unused', label: '无需回退' },
      { provider: '资源反向建档', state: 'unused', label: '无需使用' }
    ],
    resource: {
      searchRequest: 'GET {source_api}?ac=videolist&pg=1&wd=雾港档案', detailRequest: 'GET {source_api}?ac=detail&ids={vod_id}',
      resources: [
        {
          source_key: 'source-a', source_name: '演示源 A', vod_id: 'a-881', vod_name: '雾港档案', vod_year: '2026', vod_type: 'tv',
          vod_douban_id: 'demo-35700001', vod_play_from: '高速 HLS',
          vod_play_url: '第1集$https://route-a.example/harbor/s01e01.m3u8#第3集$http://127.0.0.1:4174/hls/decodable-faulty/index.m3u8',
          quality: { successes: 65, failures: 3, avg_first_frame_ms: 650 }, simulated_outcome: 'timeout'
        },
        {
          source_key: 'source-b', source_name: '演示源 B', vod_id: 'b-104', vod_name: '雾港档案', vod_year: '2026', vod_type: 'tv',
          vod_douban_id: '', vod_play_from: '稳定线$$$MP4 兼容线',
          vod_play_url: 'S01E01$https://route-b.example/harbor/s01e01.m3u8#S01E03$http://127.0.0.1:4174/hls/decodable-healthy/index.m3u8$$$第3集$https://route-b.example/harbor/s01e03.mp4',
          quality: { successes: 48, failures: 4, avg_first_frame_ms: 920 }, simulated_outcome: 'success'
        },
        {
          source_key: 'source-c', source_name: '演示源 C', vod_id: 'c-017', vod_name: '雾港档案', vod_year: '2018', vod_type: 'tv',
          vod_douban_id: '', vod_play_from: '旧版归档', vod_play_url: '第3集$https://route-c.example/harbor-2018/e03.m3u8',
          quality: { successes: 92, failures: 1, avg_first_frame_ms: 600 }, simulated_outcome: 'success'
        }
      ]
    },
    targetEpisode: { season: 1, label: '第3集', episode_key: 'S01E03', media_unit_id: 'media-demo-001:S01E03' },
    expectedOutcome: 'failover'
  };

  var desert = {
    id: 'letters-from-wasteland', title: '荒原来信', subtitle: '豆瓣无结果 · TMDB 回退',
    keywords: ['荒原', '来信', '豆瓣没有', 'tmdb', '替代源', '电影'],
    metadata: {
      provider: 'tmdb', providerLabel: 'TMDB', status: 'confirmed',
      endpoint: 'https://api.themoviedb.org/3/movie/demo-92001', externalId: 'demo-92001', internalId: 'media-demo-002',
      response: {
        id: 'demo-92001', title: '荒原来信', original_title: 'Letters from the Wasteland', year: '2025',
        intro: '豆瓣无结果时由替代元数据源建立目录的电影样例。', genres: ['剧情', '公路'], countries: ['中国大陆'],
        rating: { value: 7.7, count: 3210 }, directors: [{ name: '示例导演乙' }], actors: [{ name: '示例演员丙' }], type: 'movie', season: 1
      },
      reviews: []
    },
    providerStates: [
      { provider: '豆瓣', state: 'miss', label: '无搜索结果' },
      { provider: 'TMDB', state: 'hit', label: '命中详情与评分' },
      { provider: '资源反向建档', state: 'unused', label: '无需使用' }
    ],
    resource: {
      searchRequest: 'GET {source_api}?ac=videolist&pg=1&wd=荒原来信', detailRequest: 'GET {source_api}?ac=detail&ids={vod_id}',
      resources: [
        {
          source_key: 'licensed-d', source_name: '授权演示源 D', vod_id: 'd-920', vod_name: '荒原来信', vod_year: '2025', vod_type: 'movie',
          vod_tmdb_id: 'demo-92001', vod_play_from: '电影主线', vod_play_url: '正片$http://127.0.0.1:4174/hls/decodable-healthy/index.m3u8',
          quality: { successes: 22, failures: 2, avg_first_frame_ms: 1100 }, simulated_outcome: 'success'
        },
        {
          source_key: 'licensed-e', source_name: '授权演示源 E', vod_id: 'e-411', vod_name: '荒原来信', vod_year: '2025', vod_type: 'movie',
          vod_tmdb_id: '', vod_play_from: '备用线', vod_play_url: '正片$https://route-e.example/wasteland/feature.m3u8',
          quality: { successes: 9, failures: 2, avg_first_frame_ms: 1700 }, simulated_outcome: 'success'
        }
      ]
    },
    targetEpisode: { season: 1, label: '正片', episode_key: '正片', media_unit_id: 'media-demo-002:FEATURE' },
    expectedOutcome: 'direct_success'
  };

  var alley = {
    id: 'stone-alley-short', title: '青石巷短剧', subtitle: '元数据均无 · 资源反向建档',
    keywords: ['青石巷', '短剧', '反向建档', '人工确认', '豆瓣没有'],
    metadata: {
      provider: 'resource', providerLabel: '资源反向建档', status: 'provisional',
      endpoint: 'resource://reverse-catalog/source-f/short-77', externalId: '', internalId: 'media-provisional-003',
      response: {
        id: '', title: '青石巷短剧', original_title: '', year: '2026',
        intro: '所有元数据源均无结果，由资源标题生成、等待人工确认的临时目录。', genres: ['短剧'], countries: ['中国大陆'],
        rating: null, directors: [], actors: [], type: 'tv', season: 1
      },
      reviews: []
    },
    providerStates: [
      { provider: '豆瓣', state: 'miss', label: '无搜索结果' },
      { provider: 'TMDB', state: 'miss', label: '无搜索结果' },
      { provider: '资源反向建档', state: 'review', label: '已生成待确认 Media' }
    ],
    resource: {
      searchRequest: 'GET {source_api}?ac=videolist&pg=1&wd=青石巷短剧', detailRequest: 'GET {source_api}?ac=detail&ids=short-77',
      resources: [{
        source_key: 'source-f', source_name: '短剧演示源 F', vod_id: 'short-77', vod_name: '青石巷短剧', vod_year: '2026', vod_type: 'tv',
        vod_play_from: '短剧 HLS', vod_play_url: '第1集$https://route-f.example/alley/e01.m3u8#第2集$https://route-f.example/alley/e02.m3u8',
        quality: { successes: 4, failures: 1, avg_first_frame_ms: 1300 }, simulated_outcome: 'success'
      }]
    },
    targetEpisode: { season: 1, label: '第1集', episode_key: 'S01E01', media_unit_id: 'media-provisional-003:S01E01' },
    expectedOutcome: 'manual_review'
  };

  var island = {
    id: 'island-sample', title: '孤岛样片', subtitle: '豆瓣命中 · 暂无视频资源',
    keywords: ['孤岛', '样片', '无资源', '暂无播放', '豆瓣'],
    metadata: {
      provider: 'douban', providerLabel: '豆瓣', status: 'confirmed',
      endpoint: 'https://m.douban.com/rexxar/api/v2/movie/demo-61003', externalId: 'demo-61003', internalId: 'media-demo-004',
      response: {
        id: 'demo-61003', title: '孤岛样片', original_title: 'Island Sample', year: '2024',
        intro: '有完整目录信息，但当前没有任何视频资源的边界样例。', genres: ['纪录片'], countries: ['中国大陆'],
        rating: { value: 7.1, count: 418 }, directors: [{ name: '示例导演丙' }], actors: [], type: 'movie', season: 1
      },
      reviews: []
    },
    providerStates: [
      { provider: '豆瓣', state: 'hit', label: '命中详情与评分' },
      { provider: 'TMDB', state: 'unused', label: '无需回退' },
      { provider: '视频资源', state: 'miss', label: '0 个结果' }
    ],
    resource: { searchRequest: 'GET {source_api}?ac=videolist&pg=1&wd=孤岛样片', detailRequest: '无详情请求：搜索结果为空', resources: [] },
    targetEpisode: { season: 1, label: '正片', episode_key: '正片', media_unit_id: 'media-demo-004:FEATURE' },
    expectedOutcome: 'no_resources'
  };

  var appleBipBop = {
    id: 'apple-bip-bop', title: 'Apple Bip Bop', subtitle: 'Apple Developer · 官方外部 HLS 测试流',
    keywords: ['apple', 'bip bop', '官方', '外部', 'hls', '真实源', '测试流'],
    metadata: {
      provider: 'apple_official', providerLabel: 'Apple Developer', status: 'confirmed',
      endpoint: 'https://developer.apple.com/streaming/examples/', externalId: 'apple-bipbop-hls-example', internalId: 'media-official-005',
      response: {
        id: 'apple-bipbop-hls-example', title: 'Apple Bip Bop', original_title: 'Bip Bop HLS Example', year: '2024',
        intro: 'Apple Developer 提供、用于验证 HLS 播放能力的官方公开测试流。', genres: ['技术测试', 'HLS'], countries: [],
        rating: null, directors: [], actors: [], type: 'movie', season: 1
      },
      reviews: []
    },
    providerStates: [
      { provider: 'Apple Developer', state: 'hit', label: '官方测试流' },
      { provider: '外部 CDN', state: 'hit', label: '实时请求' },
      { provider: '白名单代理', state: 'review', label: '仅固定域名路径' }
    ],
    resource: {
      searchRequest: '固定授权目录检索：Apple Developer HLS Examples · wd=Apple Bip Bop',
      detailRequest: '实时验证：devstreaming-cdn.apple.com · bipbop_16x9_variant.m3u8',
      origin: {
        officialPage: 'https://developer.apple.com/streaming/examples/',
        upstreamHost: 'devstreaming-cdn.apple.com',
        allowedPath: '/videos/streaming/examples/bipbop_16x9/',
        proxyReason: '官方 CDN 未为 localhost 提供 CORS；仅对白名单路径重写 HLS URI'
      },
      resources: [{
        source_key: 'official-apple-bipbop', source_name: 'Apple Developer 官方测试流', vod_id: 'apple-bipbop-hls-example',
        vod_name: 'Apple Bip Bop', vod_year: '2024', vod_type: 'movie',
        vod_play_from: 'Apple 官方 HLS',
        vod_play_url: '官方测试流$http://127.0.0.1:4174/external-hls/apple-bipbop/bipbop_16x9_variant.m3u8',
        quality: { successes: 0, failures: 0, avg_first_frame_ms: 0 }, simulated_outcome: 'success',
        provenance: 'official_external_test'
      }]
    },
    targetEpisode: { season: 1, label: '官方测试流', episode_key: '官方测试流', media_unit_id: 'media-official-005:FEATURE' },
    expectedOutcome: 'external_success',
    externalSource: true
  };

  var scenarios = [harbor, desert, alley, island, appleBipBop];
  return {
    researchNotice: notice,
    scenarios: scenarios,
    defaultScenarioId: harbor.id,
    douban: { endpoint: harbor.metadata.endpoint, response: harbor.metadata.response, reviewsEndpoint: harbor.metadata.reviewsEndpoint, reviews: harbor.metadata.reviews },
    appleCms: harbor.resource,
    targetEpisode: harbor.targetEpisode
  };
});
