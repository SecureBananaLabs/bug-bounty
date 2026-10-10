import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0);
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function json(response) {
  return response.json();
}

test("search matches a job created through the api", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  const created = await fetch(`${base}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "React dashboard build",
      description: "Needs a React developer for a marketing site",
      budgetMin: 400,
      budgetMax: 900,
      categoryId: "cat_web",
      skills: ["react", "typescript"]
    })
  });
  assert.equal(created.status, 201);

  const found = await json(await fetch(`${base}/api/search?q=react%20marketing`));
  assert.equal(found.success, true);
  assert.equal(found.data.query, "react marketing");
  assert.equal(found.data.jobs.length, 1);
  assert.match(found.data.jobs[0].title, /React dashboard build/);

  await close(server);
});

test("every term must match and freelancers are filtered by role", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  await fetch(`${base}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName: "Ada Byron", email: "ada@byron.dev", role: "freelancer" })
  });
  await fetch(`${base}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName: "Grace Hopper", email: "grace@byron.dev", role: "client" })
  });

  const partial = await json(await fetch(`${base}/api/search?q=byron%20missing`));
  assert.equal(partial.data.users.length, 0);

  const shared = await json(await fetch(`${base}/api/search?q=BYRON%20%20dev`));
  assert.equal(shared.data.query, "byron dev");
  assert.equal(shared.data.users.length, 2);
  assert.equal(shared.data.freelancers.length, 1);
  assert.equal(shared.data.freelancers[0].fullName, "Ada Byron");

  await close(server);
});

test("a blank query keeps returning empty groups", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  await fetch(`${base}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Blank query job",
      description: "Should still be hidden from a blank search",
      budgetMin: 100,
      budgetMax: 200,
      categoryId: "cat_misc",
      skills: ["sql"]
    })
  });

  const blank = await json(await fetch(`${base}/api/search?q=%20%20`));
  assert.deepEqual(blank.data, { query: "", users: [], jobs: [], freelancers: [] });

  const missing = await json(await fetch(`${base}/api/search`));
  assert.deepEqual(missing.data, { query: "", users: [], jobs: [], freelancers: [] });

  await close(server);
});
