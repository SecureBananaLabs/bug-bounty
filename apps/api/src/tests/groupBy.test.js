import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { groupBy } from "../utils/groupBy.js";

describe("groupBy Utility", () => {
    it("groups array of objects by property string", () => {
        const input = [
            { category: "fruit", name: "apple" },
            { category: "vegetable", name: "carrot" },
            { category: "fruit", name: "banana" },
        ];
        const result = groupBy(input, "category");
        assert.deepEqual(result, {
            fruit: [
                { category: "fruit", name: "apple" },
                { category: "fruit", name: "banana" },
            ],
            vegetable: [{ category: "vegetable", name: "carrot" }],
        });
    });

    it("groups numbers by custom function", () => {
        const input = [6.1, 4.2, 6.3];
        const result = groupBy(input, Math.floor);
        assert.deepEqual(result, {
            "4": [4.2],
            "6": [6.1, 6.3],
        });
    });

    it("handles null and non-iterable collections safely", () => {
        assert.deepEqual(groupBy(null, "id"), {});
        assert.deepEqual(groupBy(undefined, "id"), {});
        assert.deepEqual(groupBy(123, "id"), {});
    });

    it("is prototype pollution safe with dangerous keys", () => {
        const dangerous = [
            { prop: "__proto__", val: 1 },
            { prop: "constructor", val: 2 },
        ];
        const result = groupBy(dangerous, "prop");
        assert.equal(result.__proto__.length, 1);
        assert.equal({}.polluted, undefined);
    });
});