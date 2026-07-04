import test from "node:test";
import assert from "node:assert/strict";

test("POST /api/uploads", async (t) => {
  process.env.JWT_SECRET = "testsecret";
  const { createApp } = await import("../app.js");
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  await t.test("rejects request with missing file field with 400", async () => {
    const formData = new FormData();
    // Do not append any file field

    const res = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: formData
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "No file provided");
  });

  await t.test("rejects request with empty file submission with 400", async () => {
    const formData = new FormData();
    const emptyBlob = new Blob([""], { type: "text/plain" });
    formData.append("file", emptyBlob, "empty.txt");

    const res = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: formData
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "File is empty");
  });
});
