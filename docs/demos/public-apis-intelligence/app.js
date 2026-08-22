const state = {
  apis: [],
  summary: null,
  filtered: [],
  scenarios: [],
  filteredScenarios: [],
  visible: 40,
  scenarioVisible: 12,
  lastTrigger: null
};

const elements = {
  search: document.querySelector("#search"),
  group: document.querySelector("#group-filter"),
  category: document.querySelector("#category-filter"),
  scenario: document.querySelector("#scenario-filter"),
  mode: document.querySelector("#mode-filter"),
  tier: document.querySelector("#tier-filter"),
  auth: document.querySelector("#auth-filter"),
  source: document.querySelector("#source-filter"),
  sort: document.querySelector("#sort-filter"),
  table: document.querySelector("#api-table"),
  tableShell: document.querySelector("#table-shell"),
  loadMore: document.querySelector("#load-more"),
  empty: document.querySelector("#empty-state"),
  error: document.querySelector("#error-state"),
  resultSummary: document.querySelector("#result-summary"),
  activeFilter: document.querySelector("#active-filter"),
  scenarioSearch: document.querySelector("#scenario-search"),
  scenarioGroup: document.querySelector("#scenario-group"),
  scenarioCategory: document.querySelector("#scenario-category"),
  scenarioSpecific: document.querySelector("#scenario-specific"),
  scenarioGrid: document.querySelector("#scenario-grid"),
  scenarioResult: document.querySelector("#scenario-result"),
  scenarioEmpty: document.querySelector("#scenario-empty"),
  scenarioMore: document.querySelector("#scenario-more"),
  dialog: document.querySelector("#detail-dialog")
};

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const formatNumber = (value) => new Intl.NumberFormat("zh-CN").format(value);
const formatDate = (value) => value ? new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "未知";

function setOptions(select, values) {
  const current = select.value;
  const options = [...new Set(values)].sort((a, b) => a.localeCompare(b, "zh-CN"));
  select.insertAdjacentHTML("beforeend", options.map((value) => `<option>${escapeHtml(value)}</option>`).join(""));
  select.value = current;
}

function setScenarioOptions() {
  elements.scenario.insertAdjacentHTML("beforeend", state.scenarios
    .slice()
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name, "zh-CN"))
    .map((scenario) => `<option value="${escapeHtml(scenario.id)}">${escapeHtml(scenario.name)} · ${escapeHtml(scenario.categoryLabel)}</option>`)
    .join(""));
}

function renderOverview() {
  const { totals, distributions, upstream, methodology, scenarioSummary } = state.summary;
  document.querySelector("#metric-apis").textContent = formatNumber(totals.apis);
  document.querySelector("#metric-upstream").textContent = formatNumber(totals.upstreamApis);
  document.querySelector("#metric-extensions").textContent = formatNumber(totals.extensionApis);
  document.querySelector("#metric-scenarios").textContent = formatNumber(totals.scenarios);
  document.querySelector("#metric-categories").textContent = totals.categories;
  document.querySelector("#metric-groups").textContent = totals.groups;
  document.querySelector("#metric-direct").textContent = formatNumber(totals.browserDirect);
  document.querySelector("#metric-cors-unknown").textContent = formatNumber(distributions.cors.Unknown ?? 0);
  document.querySelector("#snapshot-meta").textContent = `快照 ${upstream.commit.slice(0, 12)} · 上游提交 ${formatDate(upstream.committedAt)} · 本地同步 ${formatDate(upstream.fetchedAt)}`;

  document.querySelector("#group-chart").innerHTML = scenarioSummary.dataCatalog.map((domain) => `
    <details class="data-domain" ${domain.group === "公共与知识数据" ? "open" : ""}>
      <summary>
        <span class="domain-summary-main">
          <strong>${escapeHtml(domain.group)}</strong>
          <span>${domain.objects.slice(0, 9).map((object) => `<b>${escapeHtml(object)}</b>`).join("")}</span>
        </span>
        <span class="domain-count">${domain.scenarioCount} 个场景<br />${domain.apiCount} 个 API</span>
      </summary>
      <div class="data-category-grid">
        ${domain.categories.map((category) => `
          <article class="data-category-card">
            <div class="data-category-head">
              <div><strong>${escapeHtml(category.label)}</strong><small>${escapeHtml(category.category)} · ${category.apiCount} 个 API</small></div>
              <button type="button" data-browse-category="${escapeHtml(category.category)}">查看 ${category.scenarioCount} 个场景 →</button>
            </div>
            <p class="data-question">${escapeHtml(category.question)}</p>
            <div class="data-object-list" aria-label="具体数据对象">${category.objects.map((object) => `<span>${escapeHtml(object)}</span>`).join("")}</div>
            <dl class="data-category-meta">
              <div><dt>常见输入</dt><dd>${category.inputs.map(escapeHtml).join("、")}</dd></div>
              <div><dt>常见字段</dt><dd>${category.fields.map(escapeHtml).join("、")}</dd></div>
            </dl>
          </article>
        `).join("")}
      </div>
    </details>
  `).join("");

  document.querySelector("#access-summary").innerHTML = Object.entries(distributions.useMode).map(([label, count]) => `
    <div class="access-row">
      <span class="access-dot" aria-hidden="true"></span>
      <span>${escapeHtml(label)}</span>
      <strong>${formatNumber(count)}</strong>
    </div>
  `).join("");
  const managed = totals.apis - totals.browserDirect - (distributions.useMode["仅研究/寻找替代"] ?? 0);
  document.querySelector("#backend-ratio").textContent = `${Math.round((managed / totals.apis) * 100)}%`;
  document.querySelector("#missing-list").innerHTML = methodology.missing.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const { specificApiCount, fallbackApiCount } = scenarioSummary;
  document.querySelector("#scenario-coverage").textContent = `${formatNumber(specificApiCount)} / ${formatNumber(totals.apis)} 条明确匹配 · ${formatNumber(fallbackApiCount)} 条待人工细分`;

  setOptions(elements.group, state.apis.map((api) => api.group));
  setOptions(elements.category, state.apis.map((api) => api.category));
  setOptions(elements.scenarioGroup, state.scenarios.map((scenario) => scenario.group));
  setOptions(elements.scenarioCategory, state.scenarios.map((scenario) => scenario.category));
  setScenarioOptions();
  setOptions(elements.tier, state.apis.map((api) => api.tier));
  setOptions(elements.auth, state.apis.map((api) => api.auth));
}

function pillClass(value) {
  if (["Yes", "A · 优先试用", "浏览器直连候选"].includes(value)) return "good";
  if (["No", "D · 建议替代", "仅研究/寻找替代"].includes(value)) return "bad";
  if (["Unknown", "C · 谨慎接入", "OAuth 集成"].includes(value)) return "warn";
  return "info";
}

function sourceLabel(api) {
  return api.sourceType === "curated-extension" ? "官方核验扩展" : "public-apis 上游";
}

function scenarioCard(scenario) {
  const candidates = scenario.topCandidates.slice(0, 3);
  return `
    <article class="scenario-card" data-scenario-id="${escapeHtml(scenario.id)}">
      <div class="scenario-card-head">
        <div class="scenario-kicker"><span>具体数据</span><span>${escapeHtml(scenario.categoryLabel)}</span></div>
        <span class="scenario-count">${formatNumber(scenario.apiCount)} 个候选</span>
      </div>
      <h3>${escapeHtml(scenario.name)}</h3>
      <p class="scenario-description">${escapeHtml(scenario.description)}</p>
      <p class="scenario-question"><span>它能回答</span>${escapeHtml(scenario.question)}</p>
      <section class="scenario-payload" aria-label="输入与返回数据">
        <div class="scenario-data-objects">
          <strong>你会拿到的数据</strong>
          <span>${scenario.dataObjects.map((object) => `<b>${escapeHtml(object)}</b>`).join("")}</span>
        </div>
        <dl>
          <div><dt>通常输入</dt><dd>${scenario.typicalInputs.map(escapeHtml).join("、")}</dd></div>
          <div><dt>常见返回字段</dt><dd>${scenario.exampleFields.map((field) => `<code>${escapeHtml(field)}</code>`).join("")}</dd></div>
        </dl>
      </section>
      <dl class="scenario-context">
        <div><dt>典型产品</dt><dd>${escapeHtml(scenario.products)}</dd></div>
        <div><dt>选型重点</dt><dd>${escapeHtml(scenario.selection)}</dd></div>
      </dl>
      <div class="candidate-block">
        <span class="candidate-label">目录候选 API</span>
        <div class="candidate-list">
          ${candidates.map((api) => `
            <button class="candidate-api" type="button" data-api-id="${escapeHtml(api.id)}">
              <span><strong>${escapeHtml(api.name)}</strong><small class="candidate-source ${api.sourceType === "curated-extension" ? "extension" : "upstream"}">${escapeHtml(sourceLabel(api))}${api.provider ? ` · ${escapeHtml(api.provider)}` : ""}</small><small>${escapeHtml(api.reason)}</small></span>
              <span class="candidate-score">${api.score}<small>/100</small></span>
            </button>
          `).join("")}
        </div>
      </div>
      <div class="scenario-card-foot">
        <span>归档：${escapeHtml(scenario.group)} · ${scenario.browserDirect} 个网页直连候选 · 平均准备度 ${scenario.averageScore}</span>
        <button type="button" data-filter-scenario="${escapeHtml(scenario.id)}">查看全部 ${scenario.apiCount} 个 <span aria-hidden="true">→</span></button>
      </div>
    </article>
  `;
}

function renderScenarioNavigator(resetVisible = true) {
  if (resetVisible) state.scenarioVisible = 12;
  const query = elements.scenarioSearch.value.trim().toLocaleLowerCase("zh-CN");
  const group = elements.scenarioGroup.value;
  const category = elements.scenarioCategory.value;
  const specificOnly = elements.scenarioSpecific.checked;
  state.filteredScenarios = state.scenarios.filter((scenario) => {
    const candidates = scenario.topCandidates.map((api) => `${api.name} ${api.description}`).join(" ");
    const haystack = `${scenario.name} ${scenario.description} ${scenario.products} ${scenario.selection} ${scenario.question} ${scenario.searchTerms.join(" ")} ${scenario.typicalInputs.join(" ")} ${scenario.exampleFields.join(" ")} ${scenario.group} ${scenario.category} ${scenario.categoryLabel} ${candidates}`.toLocaleLowerCase("zh-CN");
    return (!query || haystack.includes(query))
      && (!group || scenario.group === group)
      && (!category || scenario.category === category)
      && (!specificOnly || !scenario.general);
  });
  state.filteredScenarios.sort((a, b) => b.apiCount - a.apiCount || a.name.localeCompare(b.name, "zh-CN"));
  const visible = state.filteredScenarios.slice(0, state.scenarioVisible);
  elements.scenarioGrid.innerHTML = visible.map(scenarioCard).join("");
  elements.scenarioResult.textContent = `找到 ${formatNumber(state.filteredScenarios.length)} / ${formatNumber(state.scenarios.length)} 个已填充场景`;
  elements.scenarioEmpty.hidden = state.filteredScenarios.length !== 0;
  elements.scenarioMore.hidden = state.scenarioVisible >= state.filteredScenarios.length;
  elements.scenarioMore.textContent = `显示更多场景（剩余 ${formatNumber(Math.max(0, state.filteredScenarios.length - state.scenarioVisible))}）`;
}

function focusScenario(id) {
  document.querySelector("#filters").reset();
  elements.scenario.value = id;
  applyFilters(true);
  document.querySelector("#explorer").scrollIntoView({ behavior: "smooth", block: "start" });
}

function apiRow(api) {
  return `
    <tr>
      <td>
        <span class="source-badge ${api.sourceType === "curated-extension" ? "extension" : "upstream"}">${escapeHtml(sourceLabel(api))}</span>
        <strong class="api-title">${escapeHtml(api.name)}</strong>
        <span class="api-description">${escapeHtml(api.description)}</span>
      </td>
      <td>${escapeHtml(api.category)}<span class="cell-group">${escapeHtml(api.group)}</span><span class="row-scenarios">${api.scenarios.slice(0, 2).map((scenario) => `<span>${escapeHtml(scenario.name)}</span>`).join("")}</span></td>
      <td><span class="pill">${escapeHtml(api.auth)}</span></td>
      <td><span class="status-pair"><span class="pill ${pillClass(api.https)}">HTTPS ${escapeHtml(api.https)}</span><span class="pill ${pillClass(api.cors)}">CORS ${escapeHtml(api.cors)}</span></span></td>
      <td><span class="pill ${pillClass(api.useMode)}">${escapeHtml(api.useMode)}</span><span class="cell-secondary">${escapeHtml(api.risks[0])}</span></td>
      <td class="score-cell"><strong>${api.score}<small>/100</small></strong><span class="cell-secondary">${escapeHtml(api.tier)}</span><span class="score-meter"><span style="--score:${api.score}%"></span></span></td>
      <td><button class="details-button" type="button" data-api-id="${api.id}" aria-label="查看 ${escapeHtml(api.name)} 的详情">详情</button></td>
    </tr>
  `;
}

function currentFilters() {
  return {
    query: elements.search.value.trim().toLocaleLowerCase("zh-CN"),
    group: elements.group.value,
    category: elements.category.value,
    scenario: elements.scenario.value,
    mode: elements.mode.value,
    tier: elements.tier.value,
    auth: elements.auth.value,
    source: elements.source.value,
    sort: elements.sort.value
  };
}

function applyFilters(resetVisible = true) {
  const filters = currentFilters();
  if (resetVisible) state.visible = 40;
  state.filtered = state.apis.filter((api) => {
    const haystack = `${api.name} ${api.description} ${api.group} ${api.category} ${api.scenarios.map((scenario) => scenario.name).join(" ")}`.toLocaleLowerCase("zh-CN");
    return (!filters.query || haystack.includes(filters.query))
      && (!filters.group || api.group === filters.group)
      && (!filters.category || api.category === filters.category)
      && (!filters.scenario || api.scenarios.some((scenario) => scenario.id === filters.scenario))
      && (!filters.mode || api.useMode === filters.mode)
      && (!filters.tier || api.tier === filters.tier)
      && (!filters.auth || api.auth === filters.auth)
      && (!filters.source || api.sourceType === filters.source);
  });

  state.filtered.sort((a, b) => {
    if (filters.sort === "score-asc") return a.score - b.score || a.name.localeCompare(b.name);
    if (filters.sort === "name") return a.name.localeCompare(b.name);
    if (filters.sort === "category") return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
    return b.score - a.score || a.name.localeCompare(b.name);
  });
  renderResults(filters);
}

function renderResults(filters) {
  const visible = state.filtered.slice(0, state.visible);
  elements.table.innerHTML = visible.map(apiRow).join("");
  elements.empty.hidden = state.filtered.length !== 0;
  elements.table.closest("table").hidden = state.filtered.length === 0;
  elements.loadMore.hidden = state.visible >= state.filtered.length;
  elements.loadMore.textContent = `继续显示（剩余 ${formatNumber(Math.max(0, state.filtered.length - state.visible))}）`;
  elements.resultSummary.textContent = `找到 ${formatNumber(state.filtered.length)} / ${formatNumber(state.apis.length)} 个 API`;

  const scenarioLabel = filters.scenario && state.scenarios.find((scenario) => scenario.id === filters.scenario)?.name;
  const labels = [filters.query && `关键词“${filters.query}”`, filters.group, filters.category, scenarioLabel, filters.mode, filters.tier, filters.auth, filters.source && (filters.source === "curated-extension" ? "官方核验扩展" : "public-apis 上游")].filter(Boolean);
  elements.activeFilter.hidden = labels.length === 0;
  elements.activeFilter.textContent = labels.length ? `当前条件：${labels.join(" · ")}` : "";
}

function safeUrl(url) {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "#";
  } catch { return "#"; }
}

function openDetails(id, trigger) {
  const api = state.apis.find((item) => item.id === id);
  if (!api) return;
  state.lastTrigger = trigger;
  document.querySelector("#detail-group").textContent = `${api.group} / ${api.category}`;
  document.querySelector("#detail-name").textContent = api.name;
  const dimensions = [
    ["HTTPS", api.dimensions.security, 30],
    ["CORS", api.dimensions.browser, 20],
    ["认证", api.dimensions.access, 20],
    ["文档", api.dimensions.link, 15],
    ["描述", api.dimensions.metadata, 15]
  ];
  const apiScenarios = api.scenarios.map((match) => ({
    ...state.scenarios.find((scenario) => scenario.id === match.id),
    ...match
  }));
  document.querySelector("#detail-content").innerHTML = `
    <p class="detail-description">${escapeHtml(api.description)}</p>
    <section class="source-provenance ${api.sourceType === "curated-extension" ? "extension" : "upstream"}">
      <div><span>数据来源</span><strong>${escapeHtml(sourceLabel(api))}</strong></div>
      <p>${api.sourceType === "curated-extension"
        ? `${escapeHtml(api.sourceName)} · 官方文档复核于 ${escapeHtml(api.verifiedAt)}。该条目是本项目扩展，不属于 public-apis 上游。`
        : "由 public-apis/public-apis 上游目录解析；未单独完成官方存活率与配额实测。"}</p>
      ${api.coverage ? `<dl><div><dt>覆盖范围</dt><dd>${escapeHtml(api.coverage)}</dd></div><div><dt>已知限制</dt><dd>${escapeHtml(api.limitations)}</dd></div></dl>` : ""}
    </section>
    <dl class="detail-facts">
      <div><dt>认证</dt><dd>${escapeHtml(api.auth)}</dd></div>
      <div><dt>HTTPS</dt><dd>${escapeHtml(api.https)}</dd></div>
      <div><dt>CORS</dt><dd>${escapeHtml(api.cors)}</dd></div>
    </dl>
    <div class="detail-score">
      <div><span class="score-number">${api.score}</span><small>/ 100</small><span class="cell-secondary">${escapeHtml(api.tier)}</span></div>
      <div class="dimension-list">
        ${dimensions.map(([label, value, max]) => `<div class="dimension-row"><span>${label}</span><span class="score-meter"><span style="--score:${(value / max) * 100}%"></span></span><strong>${value}</strong></div>`).join("")}
      </div>
    </div>
    <section class="detail-scenarios" aria-labelledby="detail-scenarios-title">
      <h3 id="detail-scenarios-title">可用于哪些具体场景</h3>
      ${apiScenarios.map((scenario) => `
        <article>
          <div><strong>${escapeHtml(scenario.name)}</strong><span>${Math.round(scenario.confidence * 100)}% 目录匹配置信度</span></div>
          <p>${escapeHtml(scenario.description)}</p>
          <p class="detail-data-question"><strong>可以回答：</strong>${escapeHtml(scenario.question)}</p>
          <div class="detail-field-list"><strong>常见返回字段</strong><span>${scenario.exampleFields.map((field) => `<code>${escapeHtml(field)}</code>`).join("")}</span></div>
          <dl><div><dt>通常输入</dt><dd>${scenario.typicalInputs.map(escapeHtml).join("、")}</dd></div><div><dt>选型提醒</dt><dd>${escapeHtml(scenario.selection)}</dd></div></dl>
          <small>匹配依据：${escapeHtml(scenario.evidence.join("、"))}</small>
        </article>
      `).join("")}
    </section>
    <ul class="risk-list">${api.risks.map((risk) => `<li>${escapeHtml(risk)}</li>`).join("")}</ul>
    <p class="recommendation"><strong>${escapeHtml(api.useMode)}</strong><br />${escapeHtml(api.recommendation)}</p>
    <div class="detail-actions">
      <a class="button primary" href="${escapeHtml(safeUrl(api.officialDocs || api.url))}" target="_blank" rel="noreferrer">打开官方/原始文档 ↗</a>
      <button class="button secondary" type="button" data-dialog-dismiss>关闭</button>
    </div>
  `;
  elements.dialog.showModal();
  elements.dialog.querySelector(".dialog-close").focus();
}

function resetFilters() {
  document.querySelector("#filters").reset();
  applyFilters(true);
  elements.search.focus();
}

function setupEvents() {
  document.querySelector("#filters").addEventListener("input", () => applyFilters(true));
  document.querySelector("#filters").addEventListener("change", () => applyFilters(true));
  document.querySelector("#reset-filters").addEventListener("click", resetFilters);
  document.querySelector("#empty-reset").addEventListener("click", resetFilters);
  elements.loadMore.addEventListener("click", () => { state.visible += 40; applyFilters(false); });
  elements.table.addEventListener("click", (event) => {
    const button = event.target.closest("[data-api-id]");
    if (button) openDetails(button.dataset.apiId, button);
  });
  document.querySelector("#group-chart").addEventListener("click", (event) => {
    const button = event.target.closest("[data-browse-category]");
    if (!button) return;
    elements.scenarioSearch.value = "";
    elements.scenarioGroup.value = "";
    elements.scenarioCategory.value = button.dataset.browseCategory;
    elements.scenarioSpecific.checked = true;
    renderScenarioNavigator(true);
    document.querySelector("#scenarios").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  const updateScenarioNavigator = () => renderScenarioNavigator(true);
  elements.scenarioSearch.addEventListener("input", updateScenarioNavigator);
  elements.scenarioGroup.addEventListener("change", updateScenarioNavigator);
  elements.scenarioCategory.addEventListener("change", updateScenarioNavigator);
  elements.scenarioSpecific.addEventListener("change", updateScenarioNavigator);
  elements.scenarioMore.addEventListener("click", () => {
    state.scenarioVisible += 12;
    renderScenarioNavigator(false);
  });
  elements.scenarioGrid.addEventListener("click", (event) => {
    const apiButton = event.target.closest("[data-api-id]");
    if (apiButton) {
      openDetails(apiButton.dataset.apiId, apiButton);
      return;
    }
    const filterButton = event.target.closest("[data-filter-scenario]");
    if (filterButton) focusScenario(filterButton.dataset.filterScenario);
  });
  document.querySelector(".scenario-quick").addEventListener("click", (event) => {
    const button = event.target.closest("[data-scenario-query]");
    if (!button) return;
    elements.scenarioSearch.value = button.dataset.scenarioQuery;
    renderScenarioNavigator(true);
    elements.scenarioSearch.focus();
  });
  document.querySelector("#dialog-close").addEventListener("click", () => elements.dialog.close());
  elements.dialog.addEventListener("click", (event) => {
    if (event.target === elements.dialog || event.target.closest("[data-dialog-dismiss]")) elements.dialog.close();
  });
  elements.dialog.addEventListener("close", () => state.lastTrigger?.focus());

  const themeButton = document.querySelector("#theme-toggle");
  themeButton.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("public-apis-theme", next);
    themeButton.setAttribute("aria-pressed", String(next === "dark"));
  });
}

async function init() {
  const savedTheme = localStorage.getItem("public-apis-theme");
  const theme = savedTheme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.dataset.theme = theme;
  document.querySelector("#theme-toggle").setAttribute("aria-pressed", String(theme === "dark"));
  setupEvents();
  try {
    const embedded = window.__PUBLIC_APIS_CATALOG__;
    if (embedded?.apis && embedded?.summary) {
      state.apis = embedded.apis;
      state.summary = embedded.summary;
    } else {
      const [apisResponse, summaryResponse] = await Promise.all([fetch("./data/apis.json"), fetch("./data/summary.json")]);
      if (!apisResponse.ok || !summaryResponse.ok) throw new Error("Catalog response unavailable");
      [state.apis, state.summary] = await Promise.all([apisResponse.json(), summaryResponse.json()]);
    }
    state.scenarios = state.summary.scenarioSummary.scenarios;
    renderOverview();
    renderScenarioNavigator();
    applyFilters();
  } catch (error) {
    console.error(error);
    elements.error.hidden = false;
    elements.table.closest("table").hidden = true;
    elements.resultSummary.textContent = "数据加载失败";
  }
}

init();
