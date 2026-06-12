import test from "node:test";
import assert from "node:assert/strict";
import { makeId } from "../utils/id.js";

test("makeId produces prefixed IDs matching prefix_timestamp pattern", () => {
  const id = makeId("job");
  assert.match(id, /^job_\d+$/);
});

test("makeId appends sequence for same-millisecond calls", () => {
  const origNow = Date.now;
  const fixed = 1780879000000;
  Date.now = () => fixed;
  try {
    const a = makeId("job");
    const b = makeId("job");
    const c = makeId("job");
    assert.notEqual(a, b, "first and second IDs must differ");
    assert.notEqual(b, c, "second and third IDs must differ");
    assert.ok(b.includes("_"), "second ID should have sequence suffix");
    assert.ok(c.includes("_"), "third ID should have sequence suffix");
  } finally {
    Date.now = origNow;
  }
});

test("makeId resets sequence when timestamp advances", () => {
  const origNow = Date.now;
  let ts = 9999000;
  Date.now = () => ts;
  try {
    const a = makeId("usr");
    ts = 9999001;
    const b = makeId("usr");
    assert.match(a, /^usr_\d+$/);
    assert.match(b, /^usr_\d+$/);
    assert.notEqual(a, b);
  } finally {
    Date.now = origNow;
  }
});

test("different prefixes always produce distinct IDs even at same timestamp", () => {
  const origNow = Date.now;
  const fixed = 1780879999000;
  Date.now = () => fixed;
  try {
    const a = makeId("job");
    const b = makeId("pay");
    assert.ok(a.startsWith("job_"), "first ID has job prefix");
    assert.ok(b.startsWith("pay_"), "second ID has pay prefix");
    assert.notEqual(a, b, "different prefixes must produce different IDs");
  } finally {
    Date.now = origNow;
  }
});
