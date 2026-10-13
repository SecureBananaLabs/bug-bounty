import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { partition } from "../utils/partition.js";

describe("partition Utility", () => {
    it("partitions array of numbers into evens and odds", () => {
        const numbers = [1, 2, 3, 4, 5, 6];
        const [evens, odds] = partition(numbers, (n) => n % 2 === 0);
        assert.deepEqual(evens, [2, 4, 6]);
        assert.deepEqual(odds, [1, 3, 5]);
    });

    it("partitions array of objects by boolean property", () => {
        const users = [
            { user: "alice", active: true },
            { user: "bob", active: false },
            { user: "carol", active: true },
        ];
        const [activeUsers, inactiveUsers] = partition(users, "active");
        assert.deepEqual(activeUsers, [
            { user: "alice", active: true },
            { user: "carol", active: true },
        ]);
        assert.deepEqual(inactiveUsers, [{ user: "bob", active: false }]);
    });

    it("handles null, undefined and non-iterables gracefully", () => {
        assert.deepEqual(partition(null), [[], []]);
        assert.deepEqual(partition(undefined), [[], []]);
        assert.deepEqual(partition(12345), [[], []]);
    });

    it("defaults to truthy/falsy predicate when omitted", () => {
        const mixed = [0, 1, false, 2, "", 3, null, "hello"];
        const [truthy, falsy] = partition(mixed);
        assert.deepEqual(truthy, [1, 2, 3, "hello"]);
        assert.deepEqual(falsy, [0, false, "", null]);
    });
});