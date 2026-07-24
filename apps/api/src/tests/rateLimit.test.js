import assert from "node:assert/strict";
import { after, describe, it } from "node:test";

process.env.BENCHMARK_MODE = "true";
const { createApp } = await import("../app.js");

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

describe("benchmark mode rate limiting", () => {
  after(() => {
    delete process.env.BENCHMARK_MODE;
  });

  it("does not rate limit local benchmark runs", async () => {
    const server = await listen(createApp());
    const { port } = server.address();

    try {
      let lastStatus = 0;
      for (let index = 0; index < 205; index += 1) {
        const response = await fetch(`http://127.0.0.1:${port}/health`);
        lastStatus = response.status;
        await response.body?.cancel();
      }

      assert.equal(lastStatus, 200);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
