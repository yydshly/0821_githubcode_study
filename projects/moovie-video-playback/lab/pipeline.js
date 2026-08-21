(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MooviePipeline = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function round(value, digits) {
    var factor = Math.pow(10, digits == null ? 3 : digits);
    return Math.round(value * factor) / factor;
  }

  function normalizeTitle(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[\s·•:：,，。.!！?？'"“”‘’()（）\[\]【】_-]+/g, '')
      .trim();
  }

  function titleSimilarity(left, right) {
    var a = normalizeTitle(left);
    var b = normalizeTitle(right);
    if (!a || !b) return 0;
    if (a === b) return 1;
    if (a.length === 1 || b.length === 1) return a === b ? 1 : 0;

    function bigrams(value) {
      var result = [];
      for (var i = 0; i < value.length - 1; i += 1) result.push(value.slice(i, i + 2));
      return result;
    }

    var leftPairs = bigrams(a);
    var rightPairs = bigrams(b);
    var remaining = rightPairs.slice();
    var overlap = 0;
    leftPairs.forEach(function (pair) {
      var index = remaining.indexOf(pair);
      if (index >= 0) {
        overlap += 1;
        remaining.splice(index, 1);
      }
    });
    return (2 * overlap) / (leftPairs.length + rightPairs.length);
  }

  function normalizeMetadata(raw, options) {
    raw = raw || {};
    options = options || {};
    var provider = options.provider || 'douban';
    var externalIds = Object.assign({}, raw.external_ids || {});
    var externalId = options.externalId != null ? String(options.externalId) : String(raw.id || '');
    if (externalId && provider !== 'resource') externalIds[provider] = externalId;
    return {
      id: options.internalId || raw.internal_id || 'media-demo-001',
      title: String(raw.title || '').trim(),
      original_title: String(raw.original_title || '').trim(),
      year: Number(raw.year) || null,
      type: raw.type === 'movie' ? 'movie' : 'tv',
      season: Math.max(1, Number(raw.season) || 1),
      external_ids: externalIds,
      metadata_provider: provider,
      status: options.status || 'confirmed',
      rating: raw.rating && Number(raw.rating.value) || null,
      rating_count: raw.rating && Number(raw.rating.count) || 0,
      genres: Array.isArray(raw.genres) ? raw.genres.slice() : [],
      summary: String(raw.intro || ''),
      people: []
        .concat(Array.isArray(raw.directors) ? raw.directors : [])
        .concat(Array.isArray(raw.actors) ? raw.actors : [])
        .map(function (person) { return person && person.name; })
        .filter(Boolean)
    };
  }

  function searchScenarios(scenarios, query) {
    var normalizedQuery = normalizeTitle(query);
    if (!normalizedQuery) return [];
    return (Array.isArray(scenarios) ? scenarios : [])
      .map(function (scenario) {
        var title = normalizeTitle(scenario.title);
        var keywordText = normalizeTitle((scenario.keywords || []).join(' '));
        var score = 0;
        if (title === normalizedQuery) score = 100;
        else if (title.indexOf(normalizedQuery) >= 0 || normalizedQuery.indexOf(title) >= 0) score = 80;
        else if (keywordText.indexOf(normalizedQuery) >= 0) score = 60;
        else {
          var similarity = titleSimilarity(title, normalizedQuery);
          if (similarity >= 0.35) score = Math.round(similarity * 50);
        }
        return { scenario: scenario, score: score };
      })
      .filter(function (row) { return row.score > 0; })
      .sort(function (a, b) { return b.score - a.score || a.scenario.title.localeCompare(b.scenario.title, 'zh-CN'); })
      .map(function (row) { return row.scenario; });
  }

  function parseEpisodeLabel(label, fallbackSeason) {
    var input = String(label || '').trim();
    var season = Math.max(1, Number(fallbackSeason) || 1);
    var episode = null;
    var match;

    match = input.match(/S\s*(\d{1,2})\s*E\s*(\d{1,3})/i);
    if (match) {
      season = Number(match[1]);
      episode = Number(match[2]);
    }
    if (!episode) {
      match = input.match(/第\s*(\d{1,2})\s*季\s*第\s*(\d{1,3})\s*集/);
      if (match) {
        season = Number(match[1]);
        episode = Number(match[2]);
      }
    }
    if (!episode) {
      match = input.match(/第\s*(\d{1,3})\s*集/);
      if (match) episode = Number(match[1]);
    }
    if (!episode) {
      match = input.match(/(?:EP?|E)\s*0*(\d{1,3})/i);
      if (match) episode = Number(match[1]);
    }
    if (!episode && /^\d{1,3}$/.test(input)) episode = Number(input);

    if (!episode || episode < 1 || episode > 499) {
      return {
        season: season,
        episode: null,
        episode_key: input ? input.toUpperCase() : 'UNKNOWN',
        recognized: false
      };
    }
    return {
      season: season,
      episode: episode,
      episode_key: 'S' + String(season).padStart(2, '0') + 'E' + String(episode).padStart(2, '0'),
      recognized: true
    };
  }

  function parseAppleCmsResource(resource) {
    var lineNames = String(resource.vod_play_from || '').split('$$$');
    var lineValues = String(resource.vod_play_url || '').split('$$$');
    var candidates = [];
    var rejected = [];

    lineValues.forEach(function (lineValue, lineIndex) {
      var lineKey = lineNames[lineIndex] || ('line-' + (lineIndex + 1));
      String(lineValue || '').split('#').forEach(function (part, order) {
        var separator = part.indexOf('$');
        if (separator < 1) return;
        var label = part.slice(0, separator).trim();
        var url = part.slice(separator + 1).trim();
        var episode = parseEpisodeLabel(label, 1);
        var item = {
          source_key: resource.source_key,
          source_name: resource.source_name,
          vod_id: resource.vod_id,
          line_key: lineKey,
          line_order: lineIndex,
          episode_order: order,
          episode_label: label,
          season: episode.season,
          episode_key: episode.episode_key,
          url: url,
          format: url.toLowerCase().indexOf('.m3u8') >= 0 ? 'm3u8' : 'unsupported',
          quality: resource.quality || {},
          simulated_outcome: resource.simulated_outcome || 'success'
        };
        if (item.format === 'm3u8') candidates.push(item);
        else rejected.push(Object.assign({}, item, { reason: '上游 AppleCMS 主链只保留 .m3u8' }));
      });
    });

    return {
      resource: resource,
      candidates: candidates,
      rejected: rejected
    };
  }

  function matchResource(media, resource) {
    var evidence = [];
    var conflicts = [];
    var resourceYear = Number(resource.vod_year) || null;
    var resourceSeason = Number(resource.season) || 1;
    var resourceType = resource.vod_type === 'movie' ? 'movie' : 'tv';
    var yearGap = media.year && resourceYear ? Math.abs(media.year - resourceYear) : 0;

    if (yearGap > 1) conflicts.push('year_conflict:' + resourceYear + '!=' + media.year);
    if (resourceType !== media.type) conflicts.push('media_type_conflict:' + resourceType + '!=' + media.type);
    if (resourceType === 'tv' && resourceSeason !== media.season) conflicts.push('season_conflict:' + resourceSeason + '!=' + media.season);

    if (conflicts.length) {
      return { decision: 'reject', confidence: 0, evidence: evidence, conflicts: conflicts, method: 'hard_conflict' };
    }

    if (media.status === 'provisional') {
      evidence.push('resource_derived_identity', 'title_year_type_consistent');
      return { decision: 'review', confidence: 0.75, evidence: evidence, conflicts: conflicts, method: 'provisional_identity' };
    }

    var externalPairs = [
      { key: 'douban', resourceId: resource.vod_douban_id },
      { key: 'tmdb', resourceId: resource.vod_tmdb_id },
      { key: 'imdb', resourceId: resource.vod_imdb_id }
    ];
    for (var externalIndex = 0; externalIndex < externalPairs.length; externalIndex += 1) {
      var pair = externalPairs[externalIndex];
      if (pair.resourceId && media.external_ids[pair.key] && String(pair.resourceId) === String(media.external_ids[pair.key])) {
        evidence.push(pair.key + '_id_equal', 'year_compatible', 'media_type_equal', 'season_equal');
        return { decision: 'auto_accept', confidence: 1, evidence: evidence, conflicts: conflicts, method: 'exact_external_id' };
      }
    }

    var similarity = titleSimilarity(media.title, resource.vod_name);
    var titleScore = similarity * 0.4;
    var yearScore = media.year && resourceYear && media.year === resourceYear ? 0.15 : 0.075;
    var typeScore = resourceType === media.type ? 0.1 : 0;
    var seasonScore = resourceType === 'tv' && resourceSeason === media.season ? 0.15 : 0;
    var originalTitleScore = normalizeTitle(resource.vod_en) && normalizeTitle(resource.vod_en) === normalizeTitle(media.original_title) ? 0.1 : 0;
    var score = titleScore + yearScore + typeScore + seasonScore + originalTitleScore;

    if (similarity === 1) evidence.push('normalized_title_equal');
    else if (similarity >= 0.65) evidence.push('title_similar:' + round(similarity, 2));
    if (media.year === resourceYear) evidence.push('year_equal');
    if (resourceType === media.type) evidence.push('media_type_equal');
    if (resourceType === 'tv' && resourceSeason === media.season) evidence.push('season_equal');

    // 上游把标题+年份+类型精确相等作为高置信度独立层，本实验显式保留这条规则。
    if (similarity === 1 && media.year === resourceYear && resourceType === media.type) {
      return { decision: 'auto_accept', confidence: 0.95, evidence: evidence, conflicts: conflicts, method: 'title_year_type_exact' };
    }

    var confidence = round(clamp(score, 0, 1), 3);
    return {
      decision: confidence >= 0.88 ? 'auto_accept' : confidence >= 0.68 ? 'review' : 'reject',
      confidence: confidence,
      evidence: evidence,
      conflicts: conflicts,
      method: 'weighted_heuristic'
    };
  }

  function playbackHealth(quality) {
    quality = quality || {};
    var success = Math.max(0, Number(quality.successes) || 0);
    var failure = Math.max(0, Number(quality.failures) || 0);
    var total = success + failure;
    var posterior = (success + 2) / (total + 4);
    var sampleTrust = clamp(total / 20, 0, 1);
    var reliability = 0.5 + (posterior - 0.5) * sampleTrust;
    var avgLoad = Math.max(0, Number(quality.avg_first_frame_ms) || 0);
    var speed = avgLoad ? 1 / (1 + avgLoad / 5000) : 0.5;
    return round(0.8 * reliability + 0.2 * speed, 4);
  }

  function rankCandidates(media, targetEpisode, resources) {
    var rows = [];
    resources.forEach(function (resource) {
      var match = matchResource(media, resource);
      var parsed = parseAppleCmsResource(resource);
      parsed.candidates.forEach(function (candidate) {
        if (candidate.episode_key !== targetEpisode.episode_key) return;
        if (match.decision !== 'auto_accept' || match.confidence < 0.9) return;
        var health = playbackHealth(candidate.quality);
        rows.push(Object.assign({}, candidate, {
          candidate_id: candidate.source_key + ':' + candidate.vod_id + ':' + candidate.line_key + ':' + candidate.episode_key,
          media_unit_id: targetEpisode.media_unit_id,
          match: match,
          playback_health: health,
          candidate_score: round(0.85 * health + 0.15 * match.confidence, 4)
        }));
      });
    });
    return rows.sort(function (a, b) {
      return b.candidate_score - a.candidate_score || a.line_order - b.line_order;
    });
  }

  function nextSafeCandidate(candidates, currentId, failedIds, expectedUnitId) {
    failedIds = failedIds || [];
    for (var i = 0; i < candidates.length; i += 1) {
      var candidate = candidates[i];
      if (candidate.candidate_id === currentId) continue;
      if (failedIds.indexOf(candidate.candidate_id) >= 0) continue;
      if (candidate.media_unit_id !== expectedUnitId) continue;
      if (!candidate.url || candidate.match.confidence < 0.9) continue;
      return candidate;
    }
    return null;
  }

  function buildFailoverTrace(candidates, expectedUnitId, positionSeconds) {
    if (!Array.isArray(candidates) || !candidates.length) return [];
    var first = candidates[0];
    var position = Number(positionSeconds) || 0;
    var trace = [{ event: 'attempt_started', candidate_id: first.candidate_id, source: first.source_name, position: position }];
    if (first.simulated_outcome === 'success') {
      trace.push({ event: 'manifest_loaded', candidate_id: first.candidate_id, source: first.source_name, elapsed_ms: first.quality.avg_first_frame_ms || 900, position: position });
      trace.push({ event: 'first_frame', candidate_id: first.candidate_id, source: first.source_name, elapsed_ms: (first.quality.avg_first_frame_ms || 900) + 120, position: position });
      trace.push({ event: 'played_10s', candidate_id: first.candidate_id, source: first.source_name, position: position + 10 });
      return trace;
    }
    var failed = [first.candidate_id];
    var second = nextSafeCandidate(candidates, first.candidate_id, failed, expectedUnitId);
    trace.push({ event: 'fatal_error', candidate_id: first.candidate_id, source: first.source_name, reason: first.simulated_outcome || 'timeout', position: position + 1.8 });
    if (!second) {
      trace.push({ event: 'manual_alternatives', reason: '没有同集且高置信度的安全候选', position: position + 1.8 });
      return trace;
    }
    trace.push({ event: 'source_switched', from: first.candidate_id, to: second.candidate_id, source: second.source_name, position: position + 1.8, preserved: true });
    trace.push({ event: 'manifest_loaded', candidate_id: second.candidate_id, source: second.source_name, elapsed_ms: 920, position: position + 1.8 });
    trace.push({ event: 'first_frame', candidate_id: second.candidate_id, source: second.source_name, elapsed_ms: 1040, position: position + 1.8 });
    trace.push({ event: 'played_10s', candidate_id: second.candidate_id, source: second.source_name, position: position + 11.8 });
    return trace;
  }

  return {
    normalizeTitle: normalizeTitle,
    titleSimilarity: titleSimilarity,
    searchScenarios: searchScenarios,
    normalizeMetadata: normalizeMetadata,
    parseEpisodeLabel: parseEpisodeLabel,
    parseAppleCmsResource: parseAppleCmsResource,
    matchResource: matchResource,
    playbackHealth: playbackHealth,
    rankCandidates: rankCandidates,
    nextSafeCandidate: nextSafeCandidate,
    buildFailoverTrace: buildFailoverTrace
  };
});
