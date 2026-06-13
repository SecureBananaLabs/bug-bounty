import { describe, it } from "node:test";
import assert from "node:assert";
import { createApp } from "../app.js";

describe("POST /api/uploads", () => {
  it("should return 400 when no file is provided", async () => {
    const app = createApp();
    const res = await app.request("/api/uploads", {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data; boundary=test" },
      body: "--test\r\nContent-Disposition: form-data; name=\"foo\"\r\n\r\nbar\r\n--test--\r\n"
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.message);
  });
});
