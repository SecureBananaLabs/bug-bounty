import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

test("createJobSchema accepts valid budget ranges where budgetMax >= budgetMin", () => {
  const validData = {
    title: "Fullstack Engineer Needed",
    description: "Looking for an experienced engineer to build web services",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "tech_1",
    skills: ["Node.js", "JavaScript"]
  };

  const parsed = createJobSchema.parse(validData);
  assert.equal(parsed.budgetMin, 100);
  assert.equal(parsed.budgetMax, 500);
});

test("createJobSchema rejects inverted budget ranges where budgetMax < budgetMin", () => {
  const invalidData = {
    title: "Fullstack Engineer Needed",
    description: "Looking for an experienced engineer to build web services",
    budgetMin: 500,
    budgetMax: 100,
    categoryId: "tech_1",
    skills: ["Node.js"]
  };

  assert.throws(
    () => createJobSchema.parse(invalidData),
    (err) => {
      assert.equal(err.name, "ZodError");
      assert.equal(err.errors[0].message, "budgetMax must be greater than or equal to budgetMin");
      assert.deepEqual(err.errors[0].path, ["budgetMax"]);
      return true;
    }
  );
});

test("updateJobSchema allows valid partial updates and single budget fields", () => {
  const singleMin = updateJobSchema.parse({ budgetMin: 200 });
  assert.equal(singleMin.budgetMin, 200);

  const singleMax = updateJobSchema.parse({ budgetMax: 600 });
  assert.equal(singleMax.budgetMax, 600);

  const validBoth = updateJobSchema.parse({ budgetMin: 100, budgetMax: 300 });
  assert.equal(validBoth.budgetMin, 100);
  assert.equal(validBoth.budgetMax, 300);
});

test("updateJobSchema rejects inverted budget ranges when both are supplied", () => {
  assert.throws(
    () => updateJobSchema.parse({ budgetMin: 800, budgetMax: 400 }),
    (err) => {
      assert.equal(err.name, "ZodError");
      assert.equal(err.errors[0].message, "budgetMax must be greater than or equal to budgetMin");
      return true;
    }
  );
});

test("POST /api/jobs returns HTTP 400 for inverted budget range payloads", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Senior Backend Developer",
      description: "Build robust Node.js backend services and endpoints",
      budgetMin: 1000,
      budgetMax: 200,
      categoryId: "dev"
    })
  });

  const payload = await res.json();
  assert.equal(res.status, 400);
  assert.equal(payload.success, false);
  assert.match(payload.message, /budgetMax must be greater than or equal to budgetMin/);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/jobs returns HTTP 201 for valid ordered budget ranges", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Senior Backend Developer",
      description: "Build robust Node.js backend services and endpoints",
      budgetMin: 200,
      budgetMax: 1000,
      categoryId: "dev"
    })
  });

  const payload = await res.json();
  assert.equal(res.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.budgetMin, 200);
  assert.equal(payload.data.budgetMax, 1000);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
