import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("payment creation rejects invalid currency code of length 5 case 156", async (t) => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 500,
        currency: "UUUUU",
        proposalId: "prop_156"
      })
    });
    assert.equal(response.status, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
