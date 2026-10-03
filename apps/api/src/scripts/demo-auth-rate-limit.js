/**
 * Manual demo for auth rate limiting.
 * Default production limit is 10 attempts / 15 minutes per IP.
 *
 * Usage (from apps/api):
 *   node src/scripts/demo-auth-rate-limit.js
 */
import { createApp } from "../app.js";

const app = createApp();
const server = app.listen(0);
await new Promise((resolve, reject) => {
  server.once("listening", resolve);
  server.once("error", reject);
});

const { port } = server.address();
const url = `http://127.0.0.1:${port}/api/auth/login`;
const body = JSON.stringify({
  email: "attacker@example.com",
  password: "password123"
});

console.log(`Demo server on ${url}`);
console.log("Sending 12 login attempts (limit defaults to 10)...\n");

for (let i = 1; i <= 12; i += 1) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body
  });
  const payload = await response.json();
  console.log(
    `#${String(i).padStart(2, "0")} status=${response.status} body=${JSON.stringify(payload)}`
  );
}

await new Promise((resolve, reject) => {
  server.close((error) => (error ? reject(error) : resolve()));
});
console.log("\nDemo complete: attempts 1-10 succeed (or return business errors), 11+ return 429.");
