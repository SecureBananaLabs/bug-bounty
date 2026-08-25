import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { delay } from "../utils/delay.js";

describe("delay Utility", () => {
    it("resolves after specified milliseconds", async () => {
        const start = Date.now();
        await delay(50);
        const elapsed = Date.now() - start;
        assert.ok(elapsed >= 40, `Elapsed ${elapsed}ms should be >= 40ms`);
    });

    it("resolves with the provided value", async () => {
        const result = await delay(10, "resolved_value");
        assert.equal(result, "resolved_value");
    });

    it("handles zero or negative delay gracefully", async () => {
        const result = await delay(-100, 42);
        assert.equal(result, 42);
    });

    it("defaults to 0 delay and undefined value when called with no arguments", async () => {
        const result = await delay();
        assert.equal(result, undefined);
    });
});