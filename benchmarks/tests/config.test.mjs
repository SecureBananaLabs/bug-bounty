import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { applyBenchmarkRuntimeEnv } from "../config.mjs";

const originalJwtSecret = process.env.JWT_SECRET;
const originalBenchmarkMode = process.env.BENCHMARK_MODE;

describe("benchmark runtime environment", () => {
  afterEach(() => {
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }

    if (originalBenchmarkMode === undefined) {
      delete process.env.BENCHMARK_MODE;
    } else {
      process.env.BENCHMARK_MODE = originalBenchmarkMode;
    }
  });

  it("applies the configured JWT secret and benchmark mode for local runs", () => {
    delete process.env.JWT_SECRET;
    delete process.env.BENCHMARK_MODE;

    applyBenchmarkRuntimeEnv({
      jwtSecret: "benchmark-secret",
      targetUrl: ""
    });

    assert.equal(process.env.JWT_SECRET, "benchmark-secret");
    assert.equal(process.env.BENCHMARK_MODE, "true");
  });
});
