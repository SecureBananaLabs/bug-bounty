import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "development-secret";

test("POST /api/jobs returns 400 for inverted budget range", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const token = jwt.sign({ sub: "usr_1", role: "client" }, JWT_SECRET, { expiresIn: "1h" });
  const res = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      title: "Test Job",
      description: "A test job description",
      budgetMin: 1000,
      budgetMax: 1,
      categoryId: "cat_1"
    })
  });
  assert.equal(res.status, 400, "inverted budget range must return 400");
  await new Promise((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
});
