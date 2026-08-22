import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsDir = path.resolve(projectDir, "..", "..", "docs");
const portIndex = process.argv.indexOf("--port");
const portArgument = portIndex >= 0 ? process.argv[portIndex + 1] : undefined;
const requestedPort = Number(portArgument || process.env.PORT || 4179);
const host = "127.0.0.1";

if (!Number.isInteger(requestedPort) || requestedPort < 0 || requestedPort > 65535) {
  throw new Error(`Invalid port: ${portArgument || process.env.PORT}`);
}

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function resolveRequest(urlPath) {
  const pathname = decodeURIComponent(new URL(urlPath, `http://${host}`).pathname);
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const resolved = path.resolve(docsDir, relative);
  if (resolved !== docsDir && !resolved.startsWith(`${docsDir}${path.sep}`)) return null;
  return resolved;
}

const server = createServer(async (request, response) => {
  try {
    let filePath = resolveRequest(request.url || "/");
    if (!filePath) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    const info = await stat(filePath);
    if (info.isDirectory()) filePath = path.join(filePath, "index.html");
    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(body);
  } catch (error) {
    response.writeHead(error?.code === "ENOENT" ? 404 : 500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(error?.code === "ENOENT" ? "Not found" : "Internal server error");
  }
});

server.listen(requestedPort, host, () => {
  console.log("Public APIs Intelligence demo is ready:");
  console.log(`http://${host}:${requestedPort}/demos/public-apis-intelligence/`);
  console.log("Press Ctrl+C to stop.");
});
