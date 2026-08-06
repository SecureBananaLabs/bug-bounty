import { test, describe } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../app.js";

describe("GET /api/search", () => {
  test("returns 400 for overly long query", async () => {
    const app = createApp();
    const longQuery = "a".repeat(201);
    const res = await request(app).get(`/api/search?q=${longQuery}`);
    
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /too long/i);
  });

  test("returns 400 for non-string array query", async () => {
    const app = createApp();
    const res = await request(app).get(`/api/search?q=1&q=2`);
    
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /string/i);
  });

  test("trims and accepts valid query", async () => {
    const app = createApp();
    const res = await request(app).get(`/api/search?q=  valid  `);
    
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });
});
