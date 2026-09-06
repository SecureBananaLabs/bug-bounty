import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function makeServer() {
  const app = createApp();
  const server = app.listen(0);
  return new Promise((resolve) => {
    server.once("listening", () => resolve(server));
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

function jpegBytes() {
  // Minimal valid JPEG (SOI + APP0 + EOI)
  return Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
  ]);
}

function pngBytes() {
  // Minimal PNG: signature + IHDR + IEND
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR length + type
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // bit depth, color
    0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x45, 0x4e, // CRC + IEND length
    0x44, 0xae, 0x42, 0x60, 0x82, 0x00, 0x00, 0x00, // IEND type + CRC
    0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60,
    0x82,
  ]);
}

async function uploadFile(server, filename, mimetype, body) {
  const { port } = server.address();
  const boundary = "----TestBoundary" + Date.now();
  const parts = [
    `--${boundary}\r\n`,
    `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`,
    `Content-Type: ${mimetype}\r\n\r\n`,
    body,
    `\r\n--${boundary}--\r\n`,
  ];
  const payload = Buffer.concat(parts.map((p) => Buffer.from(p)));
  return fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Content-Length": String(payload.length),
    },
    body: payload,
  });
}

// --- Tests ---

test("POST /api/uploads accepts a JPEG file", async () => {
  const server = await makeServer();
  try {
    const res = await uploadFile(server, "photo.jpg", "image/jpeg", jpegBytes());
    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.filename, "photo.jpg");
    assert.equal(body.data.status, "uploaded");
  } finally {
    await closeServer(server);
  }
});

test("POST /api/uploads accepts a PNG file", async () => {
  const server = await makeServer();
  try {
    const res = await uploadFile(server, "icon.png", "image/png", pngBytes());
    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.filename, "icon.png");
  } finally {
    await closeServer(server);
  }
});

test("POST /api/uploads rejects unsupported file type", async () => {
  const server = await makeServer();
  try {
    const res = await uploadFile(
      server,
      "script.exe",
      "application/x-executable",
      Buffer.from("MZ...")
    );
    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.match(body.message, /Unsupported file type/i);
  } finally {
    await closeServer(server);
  }
});

test("POST /api/uploads rejects oversized file", async () => {
  const server = await makeServer();
  try {
    // 6 MiB exceeds the 5 MiB limit
    const bigBody = Buffer.alloc(6 * 1024 * 1024, 0x41);
    const res = await uploadFile(server, "big.jpg", "image/jpeg", bigBody);
    const body = await res.json();
    assert.equal(res.status, 413);
    assert.equal(body.success, false);
    assert.match(body.message, /size limit/i);
  } finally {
    await closeServer(server);
  }
});

test("POST /api/uploads returns JSON for disallowed type even if small", async () => {
  const server = await makeServer();
  try {
    const res = await uploadFile(
      server,
      "malware.bat",
      "application/x-bat",
      Buffer.from("@echo off")
    );
    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.match(body.message, /Unsupported file type/i);
  } finally {
    await closeServer(server);
  }
});
