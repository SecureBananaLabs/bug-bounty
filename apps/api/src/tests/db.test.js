import test from "node:test";
import assert from "node:assert/strict";
import { connectDb } from "../config/db.js";

test("connectDb uses the provided Prisma-style client", async () => {
  let calls = 0;
  const result = await connectDb({
    async $connect() {
      calls += 1;
    }
  });

  assert.equal(calls, 1);
  assert.deepEqual(result, { connected: true, driver: "prisma" });
});

test("connectDb surfaces Prisma connection failures", async () => {
  await assert.rejects(
    () =>
      connectDb({
        async $connect() {
          throw new Error("database unavailable");
        }
      }),
    /database unavailable/
  );
});
