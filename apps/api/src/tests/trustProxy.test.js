import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("createApp trusts the first reverse proxy", () => {
  const app = createApp();

  assert.equal(app.get("trust proxy"), 1);
});
