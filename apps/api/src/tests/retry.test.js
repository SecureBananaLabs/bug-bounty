import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { retry } from "../utils/retry.js";

describe("retry Utility", () => {
    it("resolves on first attempt when fn succeeds", async () => {
        const result = await retry(() => Promise.resolve("ok"));
        assert.equal(result, "ok");
    });

    it("retries and eventually succeeds", async () => {
        let calls = 0;
        const result = await retry(
            () => {
                calls++;
                if (calls < 3) throw new Error("transient");
                return Promise.resolve("recovered");
            },
            { maxRetries: 5, baseDelay: 10 }
        );
        assert.equal(result, "recovered");
        assert.equal(calls, 3);
    });

    it("throws after exhausting retries", async () => {
        await assert.rejects(
            () =>
                retry(() => Promise.reject(new Error("permanent")), {
                    maxRetries: 2,
                    baseDelay: 10,
                }),
            { message: "permanent" }
        );
    });

    it("aborts early when shouldRetry returns false", async () => {
        let calls = 0;
        await assert.rejects(
            () =>
                retry(
                    () => {
                        calls++;
                        throw new Error("fatal");
                    },
                    {
                        maxRetries: 5,
                        baseDelay: 10,
                        shouldRetry: (err) => err.message !== "fatal",
                    }
                ),
            { message: "fatal" }
        );
        assert.equal(calls, 1);
    });
});