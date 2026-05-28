import test from "node:test";
import assert from "node:assert/strict";
import { connectDb } from "../config/db.js";

test("connectDb rejects missing DATABASE_URL", async () => {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;

  try {
    await assert.rejects(
      connectDb(),
      /DATABASE_URL is required to connect to the database/
    );
  } finally {
    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }
  }
});

test("connectDb reports success when DATABASE_URL is configured", async () => {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/freelanceflow";

  try {
    assert.deepEqual(await connectDb(), {
      connected: true,
      driver: "prisma-placeholder"
    });
  } finally {
    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }
  }
});
