import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

let server;
let baseUrl;

before(async () => {
  const app = createApp();
  server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

const validJob = {
  title: "Senior Backend Developer",
  description: "We are seeking an experienced backend engineer to build scalable services.",
  budgetMin: 1000,
  budgetMax: 2000,
  categoryId: "cat_backend_01",
  skills: ["node", "express", "postgresql"]
};

test("valid job creation returns 201 with created object", async () => {
  const res = await fetch(`${baseUrl}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validJob)
  });
  const data = await res.json();

  assert.equal(res.status, 201);
  assert.equal(data.success, true);
  assert.equal(data.data.title, validJob.title);
  assert.equal(data.data.budgetMin, validJob.budgetMin);
  assert.equal(data.data.budgetMax, validJob.budgetMax);
  assert.ok(data.data.id);
});

test("inverted budget range (budgetMin: 500, budgetMax: 100) returns HTTP 400 with validation issues", async () => {
  const res = await fetch(`${baseUrl}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...validJob,
      budgetMin: 500,
      budgetMax: 100
    })
  });
  const data = await res.json();

  assert.equal(res.status, 400);
  assert.equal(data.ok, false);
  assert.ok(Array.isArray(data.issues));
  const budgetIssue = data.issues.find((issue) => issue.path.includes("budgetMax"));
  assert.ok(budgetIssue);
  assert.equal(budgetIssue.message, "budgetMax must be greater than or equal to budgetMin");
});

test("negative budgetMin returns HTTP 400", async () => {
  const res = await fetch(`${baseUrl}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...validJob,
      budgetMin: -50
    })
  });
  const data = await res.json();

  assert.equal(res.status, 400);
  assert.equal(data.ok, false);
  assert.ok(Array.isArray(data.issues));
});

test("missing or short title (<4 chars) returns HTTP 400", async () => {
  const resShort = await fetch(`${baseUrl}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...validJob,
      title: "Dev"
    })
  });
  const dataShort = await resShort.json();
  assert.equal(resShort.status, 400);
  assert.equal(dataShort.ok, false);

  const { title, ...withoutTitle } = validJob;
  const resMissing = await fetch(`${baseUrl}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(withoutTitle)
  });
  const dataMissing = await resMissing.json();
  assert.equal(resMissing.status, 400);
  assert.equal(dataMissing.ok, false);
});

test("overlong title (>150 chars) returns HTTP 400", async () => {
  const res = await fetch(`${baseUrl}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...validJob,
      title: "A".repeat(151)
    })
  });
  const data = await res.json();

  assert.equal(res.status, 400);
  assert.equal(data.ok, false);
  assert.ok(Array.isArray(data.issues));
});

test("missing or short description (<10 chars) returns HTTP 400", async () => {
  const resShort = await fetch(`${baseUrl}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...validJob,
      description: "Too short"
    })
  });
  const dataShort = await resShort.json();
  assert.equal(resShort.status, 400);
  assert.equal(dataShort.ok, false);

  const { description, ...withoutDesc } = validJob;
  const resMissing = await fetch(`${baseUrl}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(withoutDesc)
  });
  const dataMissing = await resMissing.json();
  assert.equal(resMissing.status, 400);
  assert.equal(dataMissing.ok, false);
});

test("overlong description (>5000 chars) returns HTTP 400", async () => {
  const res = await fetch(`${baseUrl}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...validJob,
      description: "D".repeat(5001)
    })
  });
  const data = await res.json();

  assert.equal(res.status, 400);
  assert.equal(data.ok, false);
  assert.ok(Array.isArray(data.issues));
});

test("missing categoryId returns HTTP 400", async () => {
  const { categoryId, ...withoutCat } = validJob;
  const res = await fetch(`${baseUrl}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(withoutCat)
  });
  const data = await res.json();

  assert.equal(res.status, 400);
  assert.equal(data.ok, false);
  assert.ok(Array.isArray(data.issues));
});

test("skills array exceeding 30 items returns HTTP 400", async () => {
  const res = await fetch(`${baseUrl}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...validJob,
      skills: Array.from({ length: 31 }, (_, i) => `skill_${i}`)
    })
  });
  const data = await res.json();

  assert.equal(res.status, 400);
  assert.equal(data.ok, false);
  assert.ok(Array.isArray(data.issues));
});

test("GET /api/jobs returns 200 with array of jobs", async () => {
  const res = await fetch(`${baseUrl}/api/jobs`);
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.data));
});
