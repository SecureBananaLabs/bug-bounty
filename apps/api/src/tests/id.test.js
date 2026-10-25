import test from "node:test";
import assert from "node:assert/strict";
import { generateId } from "../utils/id.js";

test("Unit Test: generateId prepends the correct prefix and retains readability", () => {
  const prefix = "usr_";
  const id = generateId(prefix);
  
  assert.ok(id.startsWith(prefix));
  // The structure should be: prefix + timestamp + _ + counter + _ + rand
  const parts = id.slice(prefix.length).split("_");
  assert.equal(parts.length, 3);
  
  const timestamp = parseInt(parts[0], 10);
  assert.ok(!isNaN(timestamp));
  // Ensure timestamp is roughly current (within 5 seconds)
  assert.ok(Math.abs(Date.now() - timestamp) < 5000);
});

test("Regression Test: generateId produces unique IDs within the same millisecond", () => {
  const ids = new Set();
  const count = 1000;
  
  // Temporarily stub Date.now to return a static value
  const originalNow = Date.now;
  Date.now = () => 1782460000000;
  
  try {
    for (let i = 0; i < count; i++) {
      ids.add(generateId("job_"));
    }
  } finally {
    Date.now = originalNow;
  }
  
  // Verify that all 1000 generated IDs are unique
  assert.equal(ids.size, count);
});
