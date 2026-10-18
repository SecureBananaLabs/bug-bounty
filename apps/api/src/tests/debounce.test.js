import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { debounce } from "../utils/debounce.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe("debounce Utility", () => {
    it("debounces a function", async () => {
        let callCount = 0;
        const debounced = debounce(() => callCount++, 32);

        debounced();
        debounced();
        debounced();
        
        assert.equal(callCount, 0);
        
        await sleep(64);
        assert.equal(callCount, 1);
    });

    it("supports leading edge", async () => {
        let callCount = 0;
        const debounced = debounce(() => callCount++, 32, { leading: true, trailing: false });

        debounced(); // calls immediately
        assert.equal(callCount, 1);
        
        debounced(); // ignored
        debounced(); // ignored
        
        await sleep(64);
        assert.equal(callCount, 1);
    });
    
    it("supports cancel", async () => {
        let callCount = 0;
        const debounced = debounce(() => callCount++, 32);

        debounced();
        debounced.cancel();
        
        await sleep(64);
        assert.equal(callCount, 0);
    });
    
    it("supports flush", () => {
        let callCount = 0;
        const debounced = debounce(() => callCount++, 32);

        debounced();
        debounced.flush();
        
        assert.equal(callCount, 1);
    });
});