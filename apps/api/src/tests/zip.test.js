import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { zip, unzip } from "../utils/zip.js";

describe("zip and unzip Utilities", () => {
    it("zips multiple arrays together", () => {
        const zipped = zip(["a", "b"], [1, 2], [true, false]);
        assert.deepEqual(zipped, [
            ["a", 1, true],
            ["b", 2, false],
        ]);
    });

    it("handles uneven array lengths with undefined padding", () => {
        const zipped = zip(["a", "b", "c"], [1, 2]);
        assert.deepEqual(zipped, [
            ["a", 1],
            ["b", 2],
            ["c", undefined],
        ]);
    });

    it("unzips an array of grouped elements", () => {
        const grouped = [
            ["a", 1, true],
            ["b", 2, false],
        ];
        const unzipped = unzip(grouped);
        assert.deepEqual(unzipped, [
            ["a", "b"],
            [1, 2],
            [true, false],
        ]);
    });

    it("handles null, undefined, or empty inputs safely", () => {
        assert.deepEqual(zip(), []);
        assert.deepEqual(zip([], []), []);
        assert.deepEqual(unzip(null), []);
        assert.deepEqual(unzip([]), []);
    });
});