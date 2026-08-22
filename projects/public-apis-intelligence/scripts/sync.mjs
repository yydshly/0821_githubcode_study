import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parseCatalog, buildSummary, toCsv } from "../lib/catalog.mjs";
import { buildExtensionEntries } from "../lib/extensions.mjs";
import { enrichEntriesWithScenarios, buildScenarioSummary } from "../lib/scenarios.mjs";

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspaceDir = path.resolve(projectDir, "../..");
const sourceDir = path.join(projectDir, "data", "source");
const outputDir = path.join(projectDir, "data", "generated");
const demoDataDir = path.join(workspaceDir, "docs", "demos", "public-apis-intelligence", "data");
const offline = process.argv.includes("--offline");
const readmePath = path.join(sourceDir, "README.md");
const agricultureExtensionPath = path.join(projectDir, "data", "extensions", "agriculture.json");

async function fetchText(url) {
  const response = await fetch(url, { headers: { "User-Agent": "public-apis-intelligence-research" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
}

await Promise.all([mkdir(sourceDir, { recursive: true }), mkdir(outputDir, { recursive: true }), mkdir(demoDataDir, { recursive: true })]);

let markdown;
let upstream;
if (offline) {
  markdown = await readFile(readmePath, "utf8");
  upstream = JSON.parse(await readFile(path.join(sourceDir, "upstream.json"), "utf8"));
} else {
  const [readme, repositoryJson, commitJson] = await Promise.all([
    fetchText("https://raw.githubusercontent.com/public-apis/public-apis/master/README.md"),
    fetchText("https://api.github.com/repos/public-apis/public-apis"),
    fetchText("https://api.github.com/repos/public-apis/public-apis/commits/master")
  ]);
  const repository = JSON.parse(repositoryJson);
  const commit = JSON.parse(commitJson);
  markdown = readme;
  upstream = {
    repository: repository.full_name,
    url: repository.html_url,
    defaultBranch: repository.default_branch,
    commit: commit.sha,
    commitUrl: commit.html_url,
    committedAt: commit.commit?.committer?.date,
    fetchedAt: new Date().toISOString(),
    license: repository.license?.spdx_id ?? "unknown"
  };
  await writeFile(readmePath, markdown, "utf8");
  await writeFile(path.join(sourceDir, "upstream.json"), `${JSON.stringify(upstream, null, 2)}\n`, "utf8");
}

const { categories, entries: parsedEntries } = parseCatalog(markdown);
const agricultureExtension = JSON.parse(await readFile(agricultureExtensionPath, "utf8"));
const extensionEntries = buildExtensionEntries(agricultureExtension);
const allCategories = [...categories, "Agriculture"];
const entries = enrichEntriesWithScenarios([...parsedEntries, ...extensionEntries]);
const summary = buildSummary(entries, allCategories, upstream);
summary.scenarioSummary = buildScenarioSummary(entries);
summary.totals.scenarios = summary.scenarioSummary.totalScenarios;
const apisPath = path.join(outputDir, "apis.json");
const summaryPath = path.join(outputDir, "summary.json");
const csvPath = path.join(outputDir, "apis.csv");

await Promise.all([
  writeFile(apisPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8"),
  writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8"),
  writeFile(csvPath, `${toCsv(entries)}\n`, "utf8")
]);
await Promise.all([
  copyFile(apisPath, path.join(demoDataDir, "apis.json")),
  copyFile(summaryPath, path.join(demoDataDir, "summary.json")),
  copyFile(csvPath, path.join(demoDataDir, "apis.csv")),
  writeFile(
    path.join(demoDataDir, "catalog-data.js"),
    `window.__PUBLIC_APIS_CATALOG__ = ${JSON.stringify({ apis: entries, summary })};\n`,
    "utf8"
  )
]);

console.log(`Parsed ${parsedEntries.length} upstream APIs and ${extensionEntries.length} verified agriculture extensions in ${allCategories.length} categories`);
console.log(`Upstream snapshot: ${upstream.commit.slice(0, 12)}`);
console.log(`Browser-direct candidates: ${summary.totals.browserDirect}; HTTPS: ${summary.totals.https}`);
console.log(`Mapped ${summary.scenarioSummary.specificApiCount} APIs to ${summary.totals.scenarios} detailed scenarios`);
