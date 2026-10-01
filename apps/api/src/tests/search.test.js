import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { searchSchema } from "../validators/search.js";

test("searchSchema validates and sanitizes input", () => {
  const valid = searchSchema.safeParse({ q: "  software engineer  " });
  assert.equal(valid.success, true);
  assert.equal(valid.data.q, "software engineer");

  const empty = searchSchema.safeParse({});
  assert.equal(empty.success, true);
  assert.equal(empty.data.q, "");

  const exact200 = searchSchema.safeParse({ q: "a".repeat(200) });
  assert.equal(exact200.success, true);
  assert.equal(exact200.data.q.length, 200);

  const tooLong = searchSchema.safeParse({ q: "a".repeat(201) });
  assert.equal(tooLong.success, false);
  assert.match(tooLong.error.issues[0].message, /200 characters/);

  const repeated = searchSchema.safeParse({ q: ["term1", "term2"] });
  assert.equal(repeated.success, false);
  assert.match(repeated.error.issues[0].message, /must be a string/);
});

test("GET /api/search validates and limits queries over HTTP", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/search`;

  try {
    // Valid search query
    const res1 = await fetch(`${baseUrl}?q=designer`);
    assert.equal(res1.status, 200);
    const body1 = await res1.json();
    assert.equal(body1.success, true);
    assert.equal(body1.data.query, "designer");

    // Default empty search query
    const res2 = await fetch(`${baseUrl}`);
    assert.equal(res2.status, 200);
    const body2 = await res2.json();
    assert.equal(body2.success, true);
    assert.equal(body2.data.query, "");

    // Repeated query parameter (array) rejected
    const res3 = await fetch(`${baseUrl}?q=one&q=two`);
    assert.equal(res3.status, 400);
    const body3 = await res3.json();
    assert.equal(body3.success, false);
    assert.match(body3.message, /must be a string/);

    // Overly long query rejected (>200 chars)
    const longQuery = "x".repeat(205);
    const res4 = await fetch(`${baseUrl}?q=${longQuery}`);
    assert.equal(res4.status, 400);
    const body4 = await res4.json();
    assert.equal(body4.success, false);
    assert.match(body4.message, /200 characters/);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
