import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "benchmarks/api-route-manifest.json"), "utf8")
);
const endpoints = JSON.parse(
  fs.readFileSync(path.join(root, "benchmarks/endpoints.json"), "utf8")
);

const endpointKeys = new Set(
  endpoints.map((endpoint) => `${endpoint.method.toUpperCase()} ${endpoint.path}`)
);

const missing = manifest.filter((route) => {
  const key = `${route.method.toUpperCase()} ${route.path}`;
  return !endpointKeys.has(key);
});

if (missing.length > 0) {
  console.error("Missing benchmark coverage for mounted routes:");
  for (const route of missing) {
    console.error(`- ${route.method.toUpperCase()} ${route.path}`);
  }
  process.exit(1);
}

console.log(`Benchmark coverage verified for ${manifest.length} mounted routes.`);
