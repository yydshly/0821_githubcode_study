import { createHash } from "node:crypto";

export const GROUPS = {
  "自然与生命": ["Animals", "Environment", "Health", "Science & Math", "Weather"],
  "文化与媒体": ["Anime", "Art & Design", "Books", "Entertainment", "Games & Comics", "Music", "News", "Photography", "Video"],
  "安全与身份": ["Anti-Malware", "Authentication & Authorization", "Data Validation", "Email", "Phone", "Security"],
  "金融与商业": ["Blockchain", "Business", "Cryptocurrency", "Currency Exchange", "Finance", "Shopping"],
  "开发与基础设施": ["Cloud Storage & File Sharing", "Continuous Integration", "Development", "Open Source Projects", "Programming", "URL Shorteners"],
  "公共与知识数据": ["Calendar", "Dictionaries", "Government", "Open Data", "Patent", "Personality"],
  "生产力与职业": ["Documents & Productivity", "Events", "Jobs", "Social", "Text Analysis"],
  "位置与出行": ["Geocoding", "Sports & Fitness", "Tracking", "Transportation", "Vehicle"],
  "农业与食品系统": ["Agriculture"],
  "AI 与自动化": ["Machine Learning"],
  "测试与内容供给": ["Food & Drink", "Test Data"]
};

const categoryToGroup = new Map(
  Object.entries(GROUPS).flatMap(([group, categories]) => categories.map((category) => [category, group]))
);

function splitMarkdownRow(line) {
  const cells = [];
  let cell = "";
  for (let index = 1; index < line.length - 1; index += 1) {
    const char = line[index];
    if (char === "|" && line[index - 1] !== "\\") {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function cleanValue(value = "") {
  return value.replaceAll("`", "").trim();
}

function tierFor(score) {
  if (score >= 85) return "A · 优先试用";
  if (score >= 70) return "B · 值得验证";
  if (score >= 50) return "C · 谨慎接入";
  return "D · 建议替代";
}

export function assessEntry({ auth, https, cors, url, description }) {
  const security = https === "Yes" ? 30 : 0;
  const browser = cors === "Yes" ? 20 : cors === "Unknown" ? 8 : 0;
  const access = auth === "No" ? 20 : auth === "apiKey" ? 15 : auth === "OAuth" ? 12 : 8;
  const link = url.startsWith("https://") ? 15 : url.startsWith("http://") ? 5 : 0;
  const metadata = description.length >= 24 ? 15 : description.length >= 10 ? 10 : 5;
  const score = security + browser + access + link + metadata;

  let useMode = "后端代理";
  if (https !== "Yes") useMode = "仅研究/寻找替代";
  else if (auth === "OAuth") useMode = "OAuth 集成";
  else if (auth === "No" && cors === "Yes") useMode = "浏览器直连候选";

  const risks = [];
  if (https !== "Yes") risks.push("未声明 HTTPS，不建议生产接入");
  if (cors === "Unknown") risks.push("CORS 未知，需要浏览器实测");
  if (cors === "No") risks.push("浏览器不可直连，应走服务端");
  if (auth === "apiKey") risks.push("密钥不得暴露在前端");
  if (auth === "OAuth") risks.push("需要完整授权与令牌生命周期设计");
  if (!["No", "apiKey", "OAuth"].includes(auth)) risks.push("认证方式较特殊，先核对文档");
  if (risks.length === 0) risks.push("仍需验证额度、条款、延迟与数据质量");

  const recommendation =
    useMode === "浏览器直连候选"
      ? "适合无密钥原型；生产使用前验证限流、许可和稳定性。"
      : useMode === "OAuth 集成"
        ? "适合用户授权型产品；优先评估回调、安全存储和撤销流程。"
        : useMode === "后端代理"
          ? "建议通过服务端适配器统一鉴权、缓存、限流和错误处理。"
          : "先寻找 HTTPS 替代服务，不纳入默认生产候选。";

  return {
    score,
    tier: tierFor(score),
    useMode,
    dimensions: { security, browser, access, link, metadata },
    risks,
    recommendation
  };
}

export function stableId(category, name, url) {
  return createHash("sha1").update(`${category}|${name}|${url}`).digest("hex").slice(0, 12);
}

export function parseCatalog(markdown) {
  const lines = markdown.split(/\r?\n/);
  const indexStart = lines.findIndex((line) => line.trim() === "## Index");
  const firstCategory = lines.findIndex((line) => line.trim() === "### Animals");
  if (indexStart < 0 || firstCategory < 0) throw new Error("Unable to locate the upstream category index");

  const indexCategories = lines
    .slice(indexStart, firstCategory)
    .map((line) => line.match(/^\* \[([^\]]+)\]\(#[^)]+\)$/)?.[1])
    .filter(Boolean);
  const allowedCategories = new Set(indexCategories);
  const entries = [];
  let currentCategory = null;

  for (const line of lines.slice(firstCategory)) {
    const heading = line.match(/^### (.+)$/)?.[1]?.trim();
    if (heading) currentCategory = allowedCategories.has(heading) ? heading : null;
    if (!currentCategory || !line.startsWith("| [")) continue;

    const cells = splitMarkdownRow(line);
    if (cells.length < 5) continue;
    const link = cells[0].match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (!link) continue;

    const [, name, url] = link;
    const description = cells[1].trim();
    const auth = cleanValue(cells[2]);
    const https = cleanValue(cells[3]);
    const cors = cleanValue(cells[4]);
    const group = categoryToGroup.get(currentCategory) ?? "其他";
    const assessment = assessEntry({ auth, https, cors, url, description });

    entries.push({
      id: stableId(currentCategory, name, url),
      name,
      description,
      url,
      category: currentCategory,
      group,
      auth,
      https,
      cors,
      sourceType: "upstream",
      sourceName: "public-apis/public-apis",
      officialDocs: url,
      ...assessment
    });
  }

  return { categories: indexCategories, entries };
}

function countBy(items, key) {
  return Object.fromEntries(
    [...items.reduce((map, item) => map.set(item[key], (map.get(item[key]) ?? 0) + 1), new Map())]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  );
}

export function buildSummary(entries, categories, upstream) {
  const categoryStats = categories.map((category) => {
    const items = entries.filter((entry) => entry.category === category);
    return {
      category,
      group: categoryToGroup.get(category) ?? "其他",
      count: items.length,
      averageScore: Math.round(items.reduce((total, item) => total + item.score, 0) / Math.max(items.length, 1)),
      browserDirect: items.filter((item) => item.useMode === "浏览器直连候选").length
    };
  }).sort((a, b) => b.count - a.count);

  const groupStats = Object.keys(GROUPS).map((group) => {
    const items = entries.filter((entry) => entry.group === group);
    return {
      group,
      count: items.length,
      categories: GROUPS[group].length,
      averageScore: Math.round(items.reduce((total, item) => total + item.score, 0) / Math.max(items.length, 1))
    };
  }).sort((a, b) => b.count - a.count);

  return {
    generatedAt: new Date().toISOString(),
    upstream,
    totals: {
      apis: entries.length,
      categories: categories.length,
      groups: Object.keys(GROUPS).length,
      upstreamApis: entries.filter((entry) => entry.sourceType === "upstream").length,
      extensionApis: entries.filter((entry) => entry.sourceType === "curated-extension").length,
      upstreamCategories: categories.filter((category) => category !== "Agriculture").length,
      extensionCategories: categories.filter((category) => category === "Agriculture").length,
      browserDirect: entries.filter((entry) => entry.useMode === "浏览器直连候选").length,
      https: entries.filter((entry) => entry.https === "Yes").length,
      corsKnown: entries.filter((entry) => entry.cors !== "Unknown").length
    },
    distributions: {
      auth: countBy(entries, "auth"),
      https: countBy(entries, "https"),
      cors: countBy(entries, "cors"),
      tier: countBy(entries, "tier"),
      useMode: countBy(entries, "useMode"),
      sourceType: countBy(entries, "sourceType"),
      group: countBy(entries, "group")
    },
    groupStats,
    categoryStats,
    methodology: {
      label: "目录接入准备度（非真实 SLA）",
      weights: { https: 30, cors: 20, auth: 20, documentationLink: 15, description: 15 },
      missing: ["实时存活率", "延迟", "额度", "价格", "商业许可", "数据质量", "最后验证时间"]
    }
  };
}

export function toCsv(entries) {
  const fields = ["id", "name", "description", "url", "group", "category", "scenarios", "sourceType", "sourceName", "officialDocs", "verifiedAt", "coverage", "limitations", "auth", "https", "cors", "score", "tier", "useMode", "recommendation", "risks"];
  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [
    fields.join(","),
    ...entries.map((entry) => fields.map((field) => {
      if (field === "risks") return escape(entry.risks.join("；"));
      if (field === "scenarios") return escape((entry.scenarios ?? []).map((scenario) => scenario.name).join("；"));
      return escape(entry[field]);
    }).join(","))
  ].join("\n");
}
