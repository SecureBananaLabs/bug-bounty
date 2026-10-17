import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { API_ROUTES, routeLabels } from "./api-route-manifest.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(filePath) {
  return fs.readFileSync(path.join(rootDir, filePath), "utf8");
}

function normalizeMountedPath(basePath, routePath) {
  const joined = `${basePath.replace(/\/$/, "")}/${routePath.replace(/^\//, "")}`;
  return joined.replace(/\/$/, "");
}

function mountedRouters() {
  const appSource = read("apps/api/src/app.js");
  const mounts = [...appSource.matchAll(/app\.use\("([^"]+)",\s*([a-zA-Z]+)Routes\)/g)];
  return mounts.map(([, basePath, routerName]) => ({
    basePath,
    routerFile: `apps/api/src/routes/${routerName}Routes.js`
  }));
}

function routeDefinitions() {
  const routes = new Set(["GET /health"]);

  for (const mount of mountedRouters()) {
    const source = read(mount.routerFile);
    const matches = [...source.matchAll(/(?:\w+Routes|Router\(\)|adminRoutes)\.(get|post|put|patch|delete)\("([^"]+)"/gi)];
    for (const [, method, routePath] of matches) {
      routes.add(`${method.toUpperCase()} ${normalizeMountedPath(mount.basePath, routePath)}`);
    }
  }

  return routes;
}

const implemented = new Set([...routeDefinitions()].map((route) => route.replace(/\/$/, "")));
const benchmarked = new Set(routeLabels().map((label) => label.replace(/\/$/, "")));
const missing = [...implemented].filter((route) => !benchmarked.has(route));
const stale = [...benchmarked].filter((route) => !implemented.has(route));

if (missing.length || stale.length) {
  console.error("Benchmark manifest is out of sync with the Express route surface.");
  if (missing.length) {
    console.error("\nMissing from benchmarks:");
    for (const route of missing) console.error(`- ${route}`);
  }
  if (stale.length) {
    console.error("\nNo matching Express route:");
    for (const route of stale) console.error(`- ${route}`);
  }
  process.exit(1);
}

console.log(`Benchmark manifest covers ${API_ROUTES.length} routes:`);
for (const route of routeLabels()) {
  console.log(`- ${route}`);
}
