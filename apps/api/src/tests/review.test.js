import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

describe("Review API input validation and error handling", () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
    const app = createApp();
    server = app.listen(0);
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}/api/reviews`;
  });

  afterEach(async () => {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
      server = null;
    }
  });

  it("valid review creation returns 201 and expected payload", async () => {
    const payload = {
      revieweeId: "usr_client_001",
      reviewerId: "usr_freelancer_002",
      rating: 5,
      comment: "Excellent collaboration and prompt communication!"
    };

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    assert.equal(response.status, 201);
    assert.equal(data.success, true);
    assert.ok(data.data.id);
    assert.equal(data.data.revieweeId, payload.revieweeId);
    assert.equal(data.data.reviewerId, payload.reviewerId);
    assert.equal(data.data.rating, payload.rating);
    assert.equal(data.data.comment, payload.comment);
  });

  it("missing revieweeId returns 400", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewerId: "usr_freelancer_002",
        rating: 4,
        comment: "Solid delivery."
      })
    });
    const data = await response.json();

    assert.equal(response.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
    assert.ok(data.issues.some((i) => i.path.includes("revieweeId")));
  });

  it("blank revieweeId returns 400", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        revieweeId: "   ",
        reviewerId: "usr_freelancer_002",
        rating: 4,
        comment: "Solid delivery."
      })
    });
    const data = await response.json();

    assert.equal(response.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
    assert.ok(data.issues.some((i) => i.path.includes("revieweeId")));
  });

  it("missing reviewerId returns 400", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        revieweeId: "usr_client_001",
        rating: 4,
        comment: "Solid delivery."
      })
    });
    const data = await response.json();

    assert.equal(response.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
    assert.ok(data.issues.some((i) => i.path.includes("reviewerId")));
  });

  it("blank reviewerId returns 400", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        revieweeId: "usr_client_001",
        reviewerId: "   ",
        rating: 4,
        comment: "Solid delivery."
      })
    });
    const data = await response.json();

    assert.equal(response.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
    assert.ok(data.issues.some((i) => i.path.includes("reviewerId")));
  });

  it("rating < 1 returns 400", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        revieweeId: "usr_client_001",
        reviewerId: "usr_freelancer_002",
        rating: 0,
        comment: "Poor quality."
      })
    });
    const data = await response.json();

    assert.equal(response.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
    assert.ok(data.issues.some((i) => i.path.includes("rating")));
  });

  it("rating > 5 returns 400", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        revieweeId: "usr_client_001",
        reviewerId: "usr_freelancer_002",
        rating: 6,
        comment: "Beyond expectations!"
      })
    });
    const data = await response.json();

    assert.equal(response.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
    assert.ok(data.issues.some((i) => i.path.includes("rating")));
  });

  it("non-integer rating returns 400", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        revieweeId: "usr_client_001",
        reviewerId: "usr_freelancer_002",
        rating: 4.5,
        comment: "Pretty good work."
      })
    });
    const data = await response.json();

    assert.equal(response.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
    assert.ok(data.issues.some((i) => i.path.includes("rating")));
  });

  it("comment with pure whitespace returns 400", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        revieweeId: "usr_client_001",
        reviewerId: "usr_freelancer_002",
        rating: 5,
        comment: "     "
      })
    });
    const data = await response.json();

    assert.equal(response.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
    assert.ok(data.issues.some((i) => i.path.includes("comment")));
  });

  it("comment with length < 3 returns 400", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        revieweeId: "usr_client_001",
        reviewerId: "usr_freelancer_002",
        rating: 5,
        comment: "ok"
      })
    });
    const data = await response.json();

    assert.equal(response.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
    assert.ok(data.issues.some((i) => i.path.includes("comment")));
  });

  it("comment exceeding 1000 characters returns 400", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        revieweeId: "usr_client_001",
        reviewerId: "usr_freelancer_002",
        rating: 5,
        comment: "a".repeat(1001)
      })
    });
    const data = await response.json();

    assert.equal(response.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
    assert.ok(data.issues.some((i) => i.path.includes("comment")));
  });
});
