import test from "node:test";
import assert from "node:assert/strict";
import { connectDb } from "../config/db.js";

test("connectDb skips Prisma when DATABASE_URL is not configured", async () => {
  let connectCalled = false;

  const result = await connectDb({
    databaseUrl: "",
    client: {
      $connect: async () => {
        connectCalled = true;
      }
    }
  });

  assert.equal(connectCalled, false);
  assert.deepEqual(result, {
    connected: false,
    driver: "prisma",
    skipped: true,
    reason: "DATABASE_URL is not configured"
  });
});

test("connectDb connects the Prisma client when DATABASE_URL is configured", async () => {
  const calls = [];

  const result = await connectDb({
    databaseUrl: "postgresql://user:password@localhost:5432/freelanceflow",
    client: {
      $connect: async () => {
        calls.push("$connect");
      }
    }
  });

  assert.deepEqual(calls, ["$connect"]);
  assert.deepEqual(result, { connected: true, driver: "prisma" });
});
