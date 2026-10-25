import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapKeys, mapValues } from "../utils/mapKeys.js";

describe("mapKeys and mapValues Utilities", () => {
    it("mapKeys transforms keys of an object", () => {
        const res = mapKeys({ a: 1, b: 2 }, (value, key) => key + value);
        assert.deepEqual(res, { a1: 1, b2: 2 });
    });

    it("mapKeys protects against prototype pollution", () => {
        const res = mapKeys({ a: 1 }, () => "__proto__");
        assert.equal({}.polluted, undefined);
        assert.deepEqual(res, {});
    });

    it("mapValues transforms values of an object", () => {
        const users = {
            fred: { user: "fred", age: 40 },
            pebbles: { user: "pebbles", age: 1 },
        };
        const ages = mapValues(users, (o) => o.age);
        assert.deepEqual(ages, { fred: 40, pebbles: 1 });

        const shorthand = mapValues(users, "age");
        assert.deepEqual(shorthand, { fred: 40, pebbles: 1 });
    });

    it("handles null and undefined safely", () => {
        assert.deepEqual(mapKeys(null), {});
        assert.deepEqual(mapValues(undefined), {});
    });
});