import { existsSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const DIST = "dist";
const samples = [
  { url: "/", type: "home" },
  { url: "/llm/", type: "list" },
  { url: "/release/sample-lumen-3-0/", type: "article" },
  { url: "/about/", type: "static" },
];

const limits = {
  html: { home: 50, list: 45, article: 45, static: 30 },
  css: 25,
  js: { home: 6, list: 6, article: 4, static: 3 },
  requests: { home: 18, list: 15, article: 12, static: 8 },
};

const gzipSize = (file) => gzipSync(readFileSync(file)).length / 1024;
let failed = false;

for (const sample of samples) {
  const file = join(DIST, sample.url, "index.html");
  if (!existsSync(file)) {
    console.log(`SKIP ${sample.url}`);
    continue;
  }

  const html = readFileSync(file, "utf8");
  const js = [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map((match) => join(DIST, match[1]));
  const css = [...html.matchAll(/href="([^"]+\.css)"/g)].map((match) => join(DIST, match[1]));

  const htmlSize = gzipSize(file);
  const cssSize = css.reduce((total, path) => total + (existsSync(path) ? gzipSize(path) : 0), 0);
  const jsSize = js.reduce((total, path) => total + (existsSync(path) ? gzipSize(path) : 0), 0);
  const requests = js.length + css.length;

  const checks = [
    ["html", htmlSize, limits.html[sample.type]],
    ["css", cssSize, limits.css],
    ["js", jsSize, limits.js[sample.type]],
    ["requests", requests, limits.requests[sample.type]],
  ];

  const status = checks.every(([, value, limit]) => value <= limit) ? "OK" : "OVER";
  if (status === "OVER") failed = true;

  console.log(
    `${status} ${sample.url} html=${htmlSize.toFixed(1)} css=${cssSize.toFixed(1)} js=${jsSize.toFixed(1)} req=${requests}`,
  );
}

if (failed) process.exit(1);
