import test from "node:test";
import assert from "node:assert/strict";
import { adminRoutes } from "../routes/adminRoutes.js";
import { searchRoutes } from "../routes/searchRoutes.js";

function buildAdminReq({ role }) {
  return { user: role ? { role } : undefined };
}

function buildRes() {
  const status = {};
  const json = {};
  return {
    status(code) {
      status.code = code;
      return this;
    },
    json(body) {
      json.body = body;
      return this;
    },
  };
}

const adminMiddleware = adminRoutes.middleware.find((item) => typeof item === "function" && item.length === 3);

test("adminRoutes rejects non-admin role with 403", async () => {
  let advanced = false;
  const req = buildAdminReq({ role: "user" });
  const res = buildRes();
  const next = () => {
    advanced = true;
  };

  adminMiddleware(req, res, next);

  assert.equal(advanced, false, "should not call next()");
  assert.equal(res.status.code, 403);
  assert.deepEqual(res.json.body, { message: "Forbidden" });
});

test("adminRoutes allows admin role to continue", async () => {
  let advanced = false;
  const req = buildAdminReq({ role: "admin" });
  const res = buildRes();
  const next = () => {
    advanced = true;
  };

  adminMiddleware(req, res, next);

  assert.equal(advanced, true, "should call next()");
});

const searchMiddleware = searchRoutes.middleware.find((item) => typeof item === "function" && item.length === 3);

test("searchRoutes rejects array query parameter", async () => {
  const req = { query: { q: ["a", "b"] } };
  const res = buildRes();
  let advanced = false;
  const next = () => {
    advanced = true;
  };

  searchMiddleware(req, res, next);

  assert.equal(advanced, false);
  assert.equal(res.status.code, 400);
});

test("searchRoutes trims valid string query", async () => {
  const req = { query: { q: "  hello  " } };
  const res = buildRes();
  let advanced = false;
  const next = () => {
    advanced = true;
  };

  searchMiddleware(req, res, next);

  assert.equal(advanced, true);
  assert.equal(req.query.q, "hello");
});

test("searchRoutes rejects oversized and unsafe queries", async () => {
  const cases = ["x".repeat(201), "<script>", "[injection]"];
  for (const query of cases) {
    const req = { query: { q: query } };
    const res = buildRes();
    let advanced = false;
    const next = () => {
      advanced = true;
    };

    searchMiddleware(req, res, next);

    assert.equal(advanced, false);
    assert.equal(res.status.code, 400);
  }
});
