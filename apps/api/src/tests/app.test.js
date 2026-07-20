import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("api limiter is registered before JSON body parsing", async () => {
  const source = await readFile(new URL("../app.js", import.meta.url), "utf8");

  assert.ok(
    source.indexOf("app.use(apiLimiter)") < source.indexOf("app.use(express.json())"),
    "apiLimiter must run before express.json() so rate limits apply before body parsing"
  );
});
