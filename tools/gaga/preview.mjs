import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve, extname } from "node:path";
import { startNative } from "./native.mjs";
const runtime = await startNative(),
  root = resolve("dist");
const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
  ".txt": "text/plain",
  ".webp": "image/webp",
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://127.0.0.1");
    if (url.pathname === "/api/search") {
      const response = await fetch(runtime.url + req.url);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    let path = resolve(root, "." + decodeURIComponent(url.pathname));
    if (!path.startsWith(root + "/") && path !== root) {
      res.writeHead(403).end();
      return;
    }
    if (existsSync(path) && statSync(path).isDirectory()) path += "/index.html";
    if (!existsSync(path) && existsSync(path + ".html")) path += ".html";
    if (!existsSync(path)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, {
      "Content-Type": types[extname(path)] ?? "application/octet-stream",
    });
    res.end(readFileSync(path));
  } catch {
    res.writeHead(500).end();
  }
});
server.listen(4173, "127.0.0.1");
async function stop() {
  server.close();
  await runtime.stop();
  process.exit(0);
}
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
