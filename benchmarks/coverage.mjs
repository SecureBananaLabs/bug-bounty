import fs from "node:fs";
import path from "node:path";
import { coverageEndpoints } from "./endpoints.mjs";

const routeDir = path.resolve("apps/api/src/routes");
const appFile = path.resolve("apps/api/src/app.js");
const methods = ["get", "post", "put", "patch", "delete"];

function normalizeRoute(prefix, routePath) {
  const joined = `${prefix.replace(/\/$/, "")}/${routePath.replace(/^\//, "")}`;
  return joined.replace(/\/$/, "") || "/";
}

function discoverMounts() {
  const appSource = fs.readFileSync(appFile, "utf8");
  const mounts = new Map();
  const importPattern = /import\s+\{\s*(\w+)\s*\}\s+from\s+"\.\/routes\/([^"]+)\.js";/g;
  const mountPattern = /app\.use\("([^"]+)",\s*(\w+)\);/g;
  const imports = new Map();

  for (const match of appSource.matchAll(importPattern)) {
    imports.set(match[1], `${match[2]}.js`);
  }

  for (const match of appSource.matchAll(mountPattern)) {
    const [, prefix, routeVariable] = match;
    const fileName = imports.get(routeVariable);
    if (fileName && prefix.startsWith("/api/")) {
      mounts.set(fileName, prefix);
    }
  }

  return mounts;
}

function discoverRoutes() {
  const mounts = discoverMounts();
  const discovered = [];

  for (const [fileName, prefix] of mounts) {
    const source = fs.readFileSync(path.join(routeDir, fileName), "utf8");
    for (const method of methods) {
      const pattern = new RegExp(`\\.${method}\\("([^"]+)"`, "g");
      for (const match of source.matchAll(pattern)) {
        discovered.push({
          method: method.toUpperCase(),
          routePattern: normalizeRoute(prefix, match[1]),
          source: `apps/api/src/routes/${fileName}`
        });
      }
    }
  }

  return discovered.sort((a, b) =>
    `${a.method} ${a.routePattern}`.localeCompare(`${b.method} ${b.routePattern}`)
  );
}

function key(route) {
  return `${route.method} ${route.routePattern}`;
}

const discovered = discoverRoutes();
const covered = new Set(coverageEndpoints.map(key));
const missing = discovered.filter((route) => !covered.has(key(route)));
const extra = coverageEndpoints.filter(
  (route) => !discovered.some((discoveredRoute) => key(discoveredRoute) === key(route))
);

console.log(`Discovered API routes: ${discovered.length}`);
console.log(`Benchmark coverage entries: ${coverageEndpoints.length}`);

if (missing.length > 0) {
  console.error("Missing benchmark coverage:");
  for (const route of missing) {
    console.error(`- ${key(route)} (${route.source})`);
  }
}

if (extra.length > 0) {
  console.error("Benchmark entries without matching API routes:");
  for (const route of extra) {
    console.error(`- ${key(route)}`);
  }
}

if (missing.length > 0 || extra.length > 0) {
  process.exitCode = 1;
}
