import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "development-secret";

test("GET /api/admin/metrics returns 403 for non-admin role", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const token = jwt.sign({ sub: "usr_1", role: "client" }, JWT_SECRET, { expiresIn: "1h" });
  const res = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  assert.equal(res.status, 403, "non-admin user must receive 403");
  await new Promise((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
});
