import test from "node:test";
import assert from "node:assert/strict";
import { connectDb } from "../config/db.js";

const originalDatabaseUrl = process.env.DATABASE_URL;

test.after(() => {
  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
    return;
  }

  process.env.DATABASE_URL = originalDatabaseUrl;
});

test("connectDb rejects when DATABASE_URL is missing", async () => {
  delete process.env.DATABASE_URL;

  await assert.rejects(
    connectDb(),
    /DATABASE_URL is required to connect to the database/,
  );
});

test("connectDb rejects when DATABASE_URL is empty", async () => {
  process.env.DATABASE_URL = "   ";

  await assert.rejects(
    connectDb(),
    /DATABASE_URL is required to connect to the database/,
  );
});

test("connectDb reports the placeholder connection when DATABASE_URL is configured", async () => {
  process.env.DATABASE_URL = "postgres://example.local/freelanceflow";

  await assert.deepEqual(await connectDb(), {
    connected: true,
    driver: "prisma-placeholder",
  });
});
