import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LRUCache } from "../utils/lruCache.js";

describe("LRUCache Utility", () => {
    it("stores and retrieves values", () => {
        const cache = new LRUCache(3);
        cache.set("a", 1);
        cache.set("b", 2);
        assert.equal(cache.get("a"), 1);
        assert.equal(cache.get("b"), 2);
        assert.equal(cache.get("c"), undefined);
    });

    it("evicts least recently used items on capacity overflow", () => {
        const cache = new LRUCache(2);
        cache.set("a", 1);
        cache.set("b", 2);
        cache.get("a"); // a becomes most recently used
        cache.set("c", 3); // b should be evicted

        assert.equal(cache.get("b"), undefined);
        assert.equal(cache.get("a"), 1);
        assert.equal(cache.get("c"), 3);
    });

    it("handles TTL expiration properly", async () => {
        const cache = new LRUCache(5, 50); // 50ms TTL
        cache.set("temp", "value");
        assert.equal(cache.has("temp"), true);
        assert.equal(cache.get("temp"), "value");

        await new Promise((resolve) => setTimeout(resolve, 60));

        assert.equal(cache.has("temp"), false);
        assert.equal(cache.get("temp"), undefined);
    });

    it("is prototype pollution safe", () => {
        const cache = new LRUCache(5);
        cache.set("__proto__", "malicious");
        cache.set("constructor", "polluted");

        assert.equal(cache.get("__proto__"), "malicious");
        assert.equal(cache.get("constructor"), "polluted");
        assert.equal({}.malicious, undefined);
    });

    it("supports manual pruning and clear", () => {
        const cache = new LRUCache(5);
        cache.set("x", 10);
        cache.set("y", 20);
        assert.equal(cache.size, 2);
        cache.clear();
        assert.equal(cache.size, 0);
    });
});