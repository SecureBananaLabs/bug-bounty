import { readFile, readdir } from "node:fs/promises";
import { endpoints, keyOf } from "./endpoints.mjs";

// Inspect the repository's explicit Express route declarations. This guard
// fails when a route/mount changes instead of quietly benchmarking an old list.
export async function assertRouteCoverage(root = new URL("../apps/api/src/", import.meta.url)) {
  const app = await readFile(new URL("app.js", root), "utf8");
  const mounts = new Map([...app.matchAll(/app\.use\("(\/api\/[^" ]+)",\s*(\w+)\)/g)].map((m) => [m[2], m[1]]));
  const registered = [];
  for (const filename of await readdir(new URL("routes/", root))) {
    if (!filename.endsWith(".js")) continue;
    const source = await readFile(new URL(`routes/${filename}`, root), "utf8");
    for (const match of source.matchAll(/(\w+)\.(get|post|put|patch|delete|options|head)\("([^"]+)"/g)) {
      if (!mounts.has(match[1])) throw new Error(`Unmapped router: ${match[1]}`);
      const route = `${mounts.get(match[1])}${match[3] === "/" ? "" : match[3]}`;
      registered.push(`${match[2].toUpperCase()} ${route}`);
    }
  }
  const declared = endpoints.map(keyOf);
  if (new Set(declared).size !== declared.length || JSON.stringify(registered.sort()) !== JSON.stringify(declared.sort())) {
    throw new Error(`Benchmark route coverage mismatch. API: ${registered.join(", ")}; fixtures: ${declared.join(", ")}`);
  }
  return registered.length;
}
