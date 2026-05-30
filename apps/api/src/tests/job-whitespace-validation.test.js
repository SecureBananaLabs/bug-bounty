import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createJobSchema } from "../validators/job.js";

function listen(app) {
  const server = app.listen(0);
  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("job validator rejects whitespace-only text fields", () => {
  assert.throws(() =>
    createJobSchema.parse({
      title: "    ",
      description: "          ",
      budgetMin: 10,
      budgetMax: 20,
      categoryId: "   ",
      skills: ["   "]
    })
  );
});

test("POST /api/jobs trims text fields before storing a valid job", async () => {
  const app = createApp();
  const server = await listen(app);

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "  Build landing page  ",
        description: "  Create a polished landing page  ",
        budgetMin: 100,
        budgetMax: 200,
        categoryId: "  web  ",
        skills: ["  react  ", "  css  "]
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.data.title, "Build landing page");
    assert.equal(payload.data.description, "Create a polished landing page");
    assert.equal(payload.data.categoryId, "web");
    assert.deepEqual(payload.data.skills, ["react", "css"]);
  } finally {
    await close(server);
  }
});
