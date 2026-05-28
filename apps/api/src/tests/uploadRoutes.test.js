import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("Uploads should reject files larger than 5MB", async () => {
  await withServer(async (baseUrl) => {
    // Generate a 6MB buffer
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024, "a");
    const blob = new Blob([largeBuffer], { type: "text/plain" });
    
    const formData = new FormData();
    formData.append("file", blob, "large.txt");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: formData
    });
    
    assert.equal(response.status, 413, `Expected 413 Payload Too Large, got ${response.status}`);
  });
});
