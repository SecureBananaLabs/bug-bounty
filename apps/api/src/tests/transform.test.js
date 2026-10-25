import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { transform } from "../utils/transform.js";

describe("transform Utility", () => {
    it("transforms an array into an accumulated object", () => {
        const numbers = [2, 3, 4];
        const squares = transform(numbers, (acc, n) => {
            acc.push(n * n);
            return n % 2 === 0;
        }, []);
        assert.deepEqual(squares, [4, 9]); // Breaks early on 3 (not even)
    });

    it("transforms an object into a restructured key-value mapping", () => {
        const source = { a: 1, b: 2, c: 1 };
        const grouped = transform(source, (result, value, key) => {
            (result[value] || (result[value] = [])).push(key);
        }, {});
        assert.deepEqual(grouped, { "1": ["a", "c"], "2": ["b"] });
    });

    it("defaults to empty array for array source and empty object for object source", () => {
        assert.deepEqual(transform([1, 2], (acc, v) => { acc.push(v * 2); }), [2, 4]);
        assert.deepEqual(transform({ a: 1 }, (acc, v, k) => { acc[k] = v + 1; }), { a: 2 });
    });

    it("handles null and undefined safely", () => {
        assert.deepEqual(transform(null, () => {}), {});
        assert.deepEqual(transform(undefined, () => {}, []), []);
    });
});