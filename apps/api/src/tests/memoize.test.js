import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { memoize } from "../utils/memoize.js";

describe("memoize Utility", () => {
    it("memoizes results", () => {
        let callCount = 0;
        const fn = memoize((a) => {
            callCount++;
            return a * 2;
        });

        assert.equal(fn(2), 4);
        assert.equal(callCount, 1);
        
        assert.equal(fn(2), 4);
        assert.equal(callCount, 1); // cached
        
        assert.equal(fn(3), 6);
        assert.equal(callCount, 2);
    });

    it("uses resolver for cache key", () => {
        let callCount = 0;
        const fn = memoize(
            (a, b) => {
                callCount++;
                return a + b;
            },
            (a, b) => `${a}_${b}`
        );

        assert.equal(fn(1, 2), 3);
        assert.equal(callCount, 1);
        
        assert.equal(fn(1, 2), 3);
        assert.equal(callCount, 1); // cached
        
        assert.equal(fn(2, 1), 3);
        assert.equal(callCount, 2);
    });
    
    it("exposes the cache map", () => {
        const fn = memoize((a) => a);
        fn("test");
        assert.ok(fn.cache instanceof Map);
        assert.equal(fn.cache.get("test"), "test");
        
        fn.cache.clear();
        assert.equal(fn.cache.has("test"), false);
    });
});