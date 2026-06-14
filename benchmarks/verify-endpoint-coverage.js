#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const appPath = path.join(repoRoot, "apps/api/src/app.js");
const endpointsPath = path.join(repoRoot, "benchmarks/endpoints.json");

const appSource = await fs.readFile(appPath, "utf8");
const manifest = JSON.parse(await fs.readFile(endpointsPath, "utf8"));
const mountedRoutes = await discoverMountedRoutes(appSource);
const manifestRoutes = new Set(
  manifest
    .filter((endpoint) => endpoint.includeInApiCoverage !== false)
    .map((endpoint) => routeKey(endpoint.method, endpoint.coveragePath ?? endpoint.path))
);

const missing = mountedRoutes.filter((route) => !manifestRoutes.has(route));
const extra = [...manifestRoutes].filter((route) => !mountedRoutes.includes(route));

if (missing.length > 0 || extra.length > 0) {
  if (missing.length > 0) {
    console.error("Missing benchmark coverage:");
    for (const route of missing) {
      console.error(`- ${route}`);
    }
  }
  if (extra.length > 0) {
    console.error("Manifest entries without a mounted API route:");
    for (const route of extra) {
      console.error(`- ${route}`);
    }
  }
  process.exit(1);
}

console.log(`Benchmark coverage verified for ${mountedRoutes.length} API routes.`);

async function discoverMountedRoutes(source) {
  const imports = new Map();
  for (const match of source.matchAll(/import\s+\{\s*([A-Za-z0-9_]+)\s*\}\s+from\s+"(.\/routes\/[^"]+)";/g)) {
    imports.set(match[1], match[2]);
  }

  const routes = [];
  for (const match of source.matchAll(/app\.use\("([^"]+)",\s*([A-Za-z0-9_]+)\);/g)) {
    const mountPath = match[1];
    const routeVariable = match[2];
    const importPath = imports.get(routeVariable);
    if (!importPath) {
      continue;
    }

    const routeFile = path.join(path.dirname(appPath), `${importPath}.js`.replace(/\.js\.js$/, ".js"));
    const routeSource = await fs.readFile(routeFile, "utf8");
    const routeRegex = new RegExp(`${routeVariable}\\.(get|post|put|patch|delete)\\("([^"]+)"`, "g");

    for (const routeMatch of routeSource.matchAll(routeRegex)) {
      const method = routeMatch[1].toUpperCase();
      const childPath = routeMatch[2];
      routes.push(routeKey(method, joinRoute(mountPath, childPath)));
    }
  }

  return routes.sort();
}

function joinRoute(mountPath, childPath) {
  if (childPath === "/") {
    return normalizeRoute(mountPath);
  }
  return normalizeRoute(`${mountPath}${childPath}`);
}

function routeKey(method, routePath) {
  return `${method.toUpperCase()} ${normalizeRoute(routePath)}`;
}

function normalizeRoute(routePath) {
  if (routePath === "/") {
    return "/";
  }
  return routePath.replace(/\/+$/, "");
}
