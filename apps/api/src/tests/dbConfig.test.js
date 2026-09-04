import test from "node:test";
import assert from "node:assert/strict";
import { connectDb } from "../config/db.js";

test("connectDb awaits the injected Prisma client connection", async () => {
  let connectCalls = 0;
  const client = {
    async $connect() {
      connectCalls += 1;
    }
  };

  const result = await connectDb(client);

  assert.equal(connectCalls, 1);
  assert.deepEqual(result, {
    connected: true,
    driver: "prisma"
  });
});

test("connectDb surfaces Prisma connection failures", async () => {
  const failure = new Error("db unavailable");
  const client = {
    async $connect() {
      throw failure;
    }
  };

  await assert.rejects(() => connectDb(client), failure);
});
