import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("message creation succeeds with valid fields case 230", async (t) => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: "Valid message content for case 230",
        senderId: "usr_sender_230",
        recipientId: "usr_recipient_230"
      })
    });
    assert.equal(response.status, 201);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
