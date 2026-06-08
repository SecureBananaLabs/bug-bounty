import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const HERE = dirname(fileURLToPath(import.meta.url));
const THRESHOLDS = JSON.parse(
  readFileSync(join(HERE, "thresholds.json"), "utf-8"),
);

const resultPath = join(HERE, "results");
const { readdirSync } = await import("fs");
const files = readdirSync(resultPath).filter((f) => f.endsWith(".json"));
const latest = files.sort().pop();
if (!latest) {
  console.error("No benchmark results found");
  process.exit(1);
}

const data = JSON.parse(readFileSync(join(resultPath, latest), "utf-8"));
let failed = 0;

console.log(`\n Checking thresholds against ${latest}...`);
console.log(`  p99 max: ${THRESHOLDS.p99_max_ms}ms`);
console.log(`  p95 max: ${THRESHOLDS.p95_max_ms}ms`);
console.log(`  min RPS: ${THRESHOLDS.min_rps}`);

for (const r of data.results) {
  const issues = [];
  if (r.p99 > THRESHOLDS.p99_max_ms)
    issues.push(`p99=${r.p99.toFixed(0)}ms > ${THRESHOLDS.p99_max_ms}ms`);
  if (r.p95 > THRESHOLDS.p95_max_ms)
    issues.push(`p95=${r.p95.toFixed(0)}ms > ${THRESHOLDS.p95_max_ms}ms`);
  if (r.rps < THRESHOLDS.min_rps)
    issues.push(`rps=${r.rps.toFixed(0)} < ${THRESHOLDS.min_rps}`);
  if (r.errorRate > THRESHOLDS.max_error_rate)
    issues.push(
      `error=${(r.errorRate * 100).toFixed(1)}% > ${THRESHOLDS.max_error_rate * 100}%`,
    );

  if (issues.length) {
    console.log(`  FAIL  ${r.endpoint}: ${issues.join(", ")}`);
    failed++;
  } else {
    console.log(`  PASS  ${r.endpoint}`);
  }
}

if (failed) {
  console.log(`\n ${failed} endpoint(s) above threshold`);
  process.exit(1);
}
console.log("\n All thresholds met");
