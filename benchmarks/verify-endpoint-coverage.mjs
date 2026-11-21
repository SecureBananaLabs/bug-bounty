import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { benchmarkEndpoints } from "./endpoints.mjs";

const rootDir = resolve(import.meta.dirname, "..");
const appSource = await readFile(resolve(rootDir, "apps/api/src/app.js"), "utf8");

const mountedApiPrefixes = [...appSource.matchAll(/app\.use\("([^"]+)"/g)]
  .map((match) => match[1])
  .filter((path) => path.startsWith("/api/"));

const endpointPaths = benchmarkEndpoints.map((endpoint) => endpoint.path.split("?")[0]);

for (const prefix of mountedApiPrefixes) {
  assert(
    endpointPaths.some((path) => path === prefix || path.startsWith(`${prefix}/`)),
    `Missing benchmark endpoint for mounted API prefix ${prefix}`
  );
}

assert(
  endpointPaths.includes("/health"),
  "Missing benchmark endpoint for /health"
);

const duplicateKeys = benchmarkEndpoints
  .map((endpoint) => `${endpoint.method} ${endpoint.path}`)
  .filter((key, index, all) => all.indexOf(key) !== index);

assert.deepEqual(duplicateKeys, [], "Benchmark endpoint list contains duplicate method/path entries");

console.log(`Verified benchmark coverage for ${mountedApiPrefixes.length} API route prefixes and /health.`);
