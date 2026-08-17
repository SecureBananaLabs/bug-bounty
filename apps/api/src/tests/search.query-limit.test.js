import { describe, it, expect, vi } from "vitest";
import { search } from "../controllers/searchController.js";

function makeReq(query) {
  return { query: { q: query } };
}

function makeRes() {
  const res = { statusCode: 200, body: null };
  res.status = vi.fn((code) => { res.statusCode = code; return res; });
  res.json = vi.fn((body) => { res.body = body; return res; });
  return res;
}

describe("Search Query Length Limit", () => {
  it("should accept a normal query", async () => {
    const req = makeReq("javascript");
    const res = makeRes();
    await search(req, res);
    expect(res.statusCode).toBe(200);
  });

  it("should accept a 200-character query", async () => {
    const req = makeReq("a".repeat(200));
    const res = makeRes();
    await search(req, res);
    expect(res.statusCode).toBe(200);
  });

  it("should reject a 201-character query", async () => {
    const req = makeReq("a".repeat(201));
    const res = makeRes();
    await search(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("should reject a 500-character query", async () => {
    const req = makeReq("x".repeat(500));
    const res = makeRes();
    await search(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("should accept empty query (defaults to empty string)", async () => {
    const req = makeReq(undefined);
    const res = makeRes();
    await search(req, res);
    expect(res.statusCode).toBe(200);
  });
});
