import { assessEntry, stableId } from "./catalog.mjs";

export function buildExtensionEntries(extension) {
  return extension.entries.map((item) => {
    const category = "Agriculture";
    const group = "农业与食品系统";
    const assessment = assessEntry(item);
    return {
      id: stableId(category, item.name, item.officialDocs),
      name: item.name,
      description: item.description,
      url: item.url,
      category,
      group,
      auth: item.auth,
      https: item.https,
      cors: item.cors,
      sourceType: "curated-extension",
      sourceName: item.provider,
      officialDocs: item.officialDocs,
      verifiedAt: extension.verifiedAt,
      evidenceMethod: extension.method,
      coverage: item.coverage,
      limitations: item.limitations,
      ...assessment
    };
  });
}
