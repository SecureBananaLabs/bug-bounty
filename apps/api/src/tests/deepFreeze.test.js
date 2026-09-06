import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deepFreeze } from "../utils/deepFreeze.js";

describe("deepFreeze Utility", () => {
    it("freezes nested objects and arrays", () => {
        const obj = { a: 1, b: { c: 2 }, d: [3, 4] };
        deepFreeze(obj);

        assert.ok(Object.isFrozen(obj));
        assert.ok(Object.isFrozen(obj.b));
        assert.ok(Object.isFrozen(obj.d));

        assert.throws(() => {
            "use strict";
            obj.a = 5;
        }, TypeError);

        assert.throws(() => {
            "use strict";
            obj.b.c = 6;
        }, TypeError);

        assert.throws(() => {
            "use strict";
            obj.d.push(5);
        }, TypeError);
    });

    it("handles circular references gracefully", () => {
        const cycle = { name: "cycle" };
        cycle.self = cycle;

        deepFreeze(cycle);

        assert.ok(Object.isFrozen(cycle));
        assert.ok(Object.isFrozen(cycle.self));

        assert.throws(() => {
            "use strict";
            cycle.name = "mutated";
        }, TypeError);
    });

    it("safely ignores primitives and null", () => {
        assert.equal(deepFreeze(123), 123);
        assert.equal(deepFreeze("test"), "test");
        assert.equal(deepFreeze(null), null);
        assert.equal(deepFreeze(undefined), undefined);
    });

    it("does not crash on already frozen objects", () => {
        const obj = Object.freeze({ a: { b: 1 } });
        // Although the top level is frozen, deepFreeze will still traverse and freeze children
        deepFreeze(obj);
        
        assert.ok(Object.isFrozen(obj.a));
    });
});