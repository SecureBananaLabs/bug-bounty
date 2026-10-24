import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

test("invalid configuration or threshold JSON cannot leave a stale passing report", async (t) => {
  const dir = await mkdtemp(new URL("../results/.report-test-", import.meta.url));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const broken = join(dir, "broken.json");
  await writeFile(broken, "{broken");
  for (const environment of [{ BENCH_HOST: "example.com" }, { BENCH_THRESHOLDS_PATH: broken }]) {
    await writeFile(join(dir, "latest.json"), '{"complete":true,"passed":true}');
    const result = spawnSync(process.execPath, [fileURLToPath(new URL("../run.mjs", import.meta.url))], {
      env: { BENCH_RESULTS_DIR: dir, ...environment }, encoding: "utf8", timeout: 5000
    });
    assert.equal(result.status, 1, result.stderr);
    const report = JSON.parse(await readFile(join(dir, "latest.json"), "utf8"));
    assert.equal(report.complete, false);
    assert.equal(report.passed, false);
    assert.equal(report.results.length, 0);
  }
});
