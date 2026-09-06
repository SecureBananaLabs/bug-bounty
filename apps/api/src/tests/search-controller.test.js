import test from "node:test";
import assert from "node:assert/strict";
import { search } from "../controllers/searchController.js";

function createResponse() {
  return {
    statusCode: undefined,
    payload: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    }
  };
}

test("search rejects empty queries", async () => {
  const res = createResponse();

  await search({ query: { q: "   " } }, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.payload, {
    success: false,
    message: "Search query is required"
  });
});

test("search trims and accepts non-empty queries", async () => {
  const res = createResponse();

  await search({ query: { q: "  react  " } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.data.query, "react");
});
