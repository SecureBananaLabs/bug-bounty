import test from "node:test";
import assert from "node:assert/strict";
import { search } from "../controllers/searchController.js";

test("search rejects non-string query", async () => {
  const mockReq = { query: { q: 123 } };
  let statusCode = 0;
  let responseBody = null;

  const mockRes = {
    status: (code) => {
      statusCode = code;
      return mockRes;
    },
    json: (body) => {
      responseBody = body;
      return mockRes;
    }
  };

  await search(mockReq, mockRes);

  assert.equal(statusCode, 400);
  assert.equal(responseBody.error, "Search query must be a string");
});

test("search rejects query longer than 200 characters", async () => {
  const longQuery = "a".repeat(201);
  const mockReq = { query: { q: longQuery } };
  let statusCode = 0;
  let responseBody = null;

  const mockRes = {
    status: (code) => {
      statusCode = code;
      return mockRes;
    },
    json: (body) => {
      responseBody = body;
      return mockRes;
    }
  };

  await search(mockReq, mockRes);

  assert.equal(statusCode, 400);
  assert.equal(responseBody.error, "Search query must be 200 characters or less");
});

test("search accepts valid query", async () => {
  const mockReq = { query: { q: "test query" } };
  let statusCode = 0;
  let responseBody = null;

  const mockRes = {
    status: (code) => {
      statusCode = code;
      return mockRes;
    },
    json: (body) => {
      responseBody = body;
      return mockRes;
    }
  };

  await search(mockReq, mockRes);

  assert.equal(statusCode, 200);
});

test("search accepts 200 character query", async () => {
  const maxQuery = "a".repeat(200);
  const mockReq = { query: { q: maxQuery } };
  let statusCode = 0;
  let responseBody = null;

  const mockRes = {
    status: (code) => {
      statusCode = code;
      return mockRes;
    },
    json: (body) => {
      responseBody = body;
      return mockRes;
    }
  };

  await search(mockReq, mockRes);

  assert.equal(statusCode, 200);
});
