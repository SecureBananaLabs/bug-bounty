import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pick } from "../utils/pick.js";

describe("pick Utility", () => {
    it("picks specified keys from an object", () => {
        const obj = { a: 1, b: "2", c: 3 };
        assert.deepEqual(pick(obj, ["a", "c"]), { a: 1, c: 3 });
        assert.deepEqual(pick(obj, "b"), { b: "2" });
    });

    it("ignores non-existent keys", () => {
        const obj = { a: 1, b: 2 };
        assert.deepEqual(pick(obj, ["a", "z"]), { a: 1 });
    });

    it("handles null, undefined, or primitive objects safely", () => {
        assert.deepEqual(pick(null, ["a"]), {});
        assert.deepEqual(pick(undefined, ["a"]), {});
        assert.deepEqual(pick(123, ["a"]), {});
    });

    it("prevents prototype pollution", () => {
        const obj = { __proto__: { evil: true }, a: 1 };
        const picked = pick(obj, ["__proto__", "a"]);
        assert.deepEqual(picked, { a: 1 });
        assert.equal({}.evil, undefined);
    });
});