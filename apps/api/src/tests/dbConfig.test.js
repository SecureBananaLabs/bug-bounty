import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { connectDb, disconnectDb, getDbStatus } from "../config/db.js";

describe("Database Connection Lifecycle & Validation (#5268, #4333)", () => {
  it("connects with prisma-postgresql driver when a valid PostgreSQL DATABASE_URL is configured", async () => {
    const status = await connectDb({
      databaseUrl: "postgresql://postgres:secret@db.internal:5432/freelanceflow"
    });

    assert.equal(status.connected, true);
    assert.equal(status.driver, "prisma-postgresql");
    assert.equal(status.host, "db.internal");
    assert.equal(getDbStatus().connected, true);
  });

  it("falls back to in-memory driver in development when DATABASE_URL is empty", async () => {
    const status = await connectDb({ databaseUrl: "", nodeEnv: "development" });
    assert.equal(status.connected, true);
    assert.equal(status.driver, "in-memory");
  });

  it("throws descriptive error in production when DATABASE_URL is missing", async () => {
    await assert.rejects(
      () => connectDb({ databaseUrl: "   ", nodeEnv: "production" }),
      /DATABASE_URL is required in production/
    );
  });

  it("rejects malformed or unsupported database URL protocols", async () => {
    await assert.rejects(
      () => connectDb({ databaseUrl: "not-a-valid-url" }),
      /Invalid DATABASE_URL format/
    );
    await assert.rejects(
      () => connectDb({ databaseUrl: "http://localhost:5432/db" }),
      /Unsupported database protocol/
    );
  });

  it("disconnectDb resets connection state cleanly", async () => {
    await connectDb({ databaseUrl: "postgres://user:pass@localhost:5432/app" });
    const afterDisconnect = await disconnectDb();
    assert.equal(afterDisconnect.connected, false);
    assert.equal(afterDisconnect.driver, "disconnected");
  });
});
