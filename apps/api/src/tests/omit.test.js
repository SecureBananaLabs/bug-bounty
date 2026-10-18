import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { omit } from "../utils/omit.js";

describe("omit Utility", () => {
    it("omits specified keys from an object", () => {
        const obj = { a: 1, b: "2", c: 3 };
        assert.deepEqual(omit(obj, ["a", "c"]), { b: "2" });
        assert.deepEqual(omit(obj, "b"), { a: 1, c: 3 });
    });

    it("handles non-existent keys", () => {
        const obj = { a: 1, b: 2 };
        assert.deepEqual(omit(obj, ["z"]), { a: 1, b: 2 });
    });

    it("handles null, undefined, or primitive objects safely", () => {
        assert.deepEqual(omit(null, ["a"]), {});
        assert.deepEqual(omit(undefined, ["a"]), {});
        assert.deepEqual(omit(123, ["a"]), {});
    });

    it("prevents prototype pollution", () => {
        const obj = { a: 1, b: 2 };
        const result = omit(obj, ["b"]);
        assert.deepEqual(result, { a: 1 });
        assert.equal({}.polluted, undefined);
    });
});