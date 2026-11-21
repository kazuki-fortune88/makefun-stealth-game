// Midnight Gallery — a tiny static dev server for the game.
// Serves game/ at http://localhost:8080 so the game can be played in a
// desktop browser. No build step, no network: only files under game/.
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, resolve, extname } from "node:path";

const PORT = 8080;
const ROOT = resolve(import.meta.dirname, "game");

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
};

const server = createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const rel = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
  const file = join(ROOT, rel);
  if (!file.startsWith(ROOT) || !existsSync(file)) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found\n");
    return;
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
});

server.listen(PORT, () => {
  console.log(`Midnight Gallery at http://localhost:${PORT}/`);
});
