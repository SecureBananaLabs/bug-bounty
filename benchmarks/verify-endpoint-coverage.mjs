import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { endpoints } from "./endpoints.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const appPath = path.join(repoRoot, "apps/api/src/app.js");
const appSource = await fs.readFile(appPath, "utf8");

const importToFile = new Map(
  [...appSource.matchAll(/import\s+\{\s*(\w+)\s*\}\s+from\s+"\.\/routes\/([^"]+)";/g)].map(
    ([, binding, routeFile]) => [binding, path.join(repoRoot, "apps/api/src/routes", routeFile)]
  )
);

const mountedRouters = [...appSource.matchAll(/app\.use\("([^"]+)",\s*(\w+)\);/g)].filter(
  ([, mount]) => mount.startsWith("/api/")
);

const discovered = [];
for (const [, mount, binding] of mountedRouters) {
  const routePath = importToFile.get(binding);
  if (!routePath) {
    continue;
  }
  const routeSource = await fs.readFile(routePath, "utf8");
  for (const [, method, route] of routeSource.matchAll(/\w+Routes\.(get|post|put|patch|delete)\("([^"]+)"/g)) {
    discovered.push(`${method.toUpperCase()} ${joinPaths(mount, route)}`);
  }
}

const configured = endpoints.map((endpoint) =>
  `${endpoint.method.toUpperCase()} ${normalizeRoute(endpoint.path)}`
);

const missing = discovered.filter((route) => !configured.includes(route));
const extra = configured.filter((route) => !discovered.includes(route));

if (missing.length > 0 || extra.length > 0) {
  console.error("Benchmark endpoint coverage check failed.");
  if (missing.length > 0) {
    console.error("\nMissing from benchmarks/endpoints.mjs:");
    for (const route of missing) {
      console.error(`- ${route}`);
    }
  }
  if (extra.length > 0) {
    console.error("\nConfigured but not discovered in Express routes:");
    for (const route of extra) {
      console.error(`- ${route}`);
    }
  }
  process.exit(1);
}

console.log(`Benchmark endpoint coverage verified for ${configured.length} /api routes.`);

function joinPaths(mount, route) {
  if (route === "/") {
    return mount;
  }
  return `${mount}${route}`.replace(/\/+/g, "/");
}

function normalizeRoute(route) {
  return route.split("?")[0].replace("/api/auth/oauth/github/callback", "/api/auth/oauth/:provider/callback");
}
