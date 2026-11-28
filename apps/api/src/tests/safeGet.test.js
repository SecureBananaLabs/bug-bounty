import test from "node:test";
import assert from "node:assert/strict";
import { safeGet } from "../utils/safeGet.js";

test("reads a simple dot-notation path", () => {
  const target = { user: { profile: { name: "Alice" } } };
  assert.equal(safeGet(target, "user.profile.name", "fallback"), "Alice");
});

test("reads array indices via bracket notation", () => {
  const target = { items: [{ id: 1 }, { id: 2 }] };
  assert.equal(safeGet(target, "items[0].id", "fallback"), 1);
  assert.equal(safeGet(target, "items[1].id", "fallback"), 2);
});

test("reads a pre-split array path", () => {
  const target = { items: [{ id: "a" }, { id: "b" }] };
  assert.equal(safeGet(target, ["items", 0, "id"], "fallback"), "a");
  assert.equal(safeGet(target, ["items", 1, "id"], "fallback"), "b");
});

test("returns defaultValue for missing intermediate keys", () => {
  const target = { user: {} };
  assert.equal(safeGet(target, "user.profile.name", "fallback"), "fallback");
  assert.equal(safeGet(target, "a.b.c", "fallback"), "fallback");
});

test("preserves falsy values instead of falling back", () => {
  const target = { zero: 0, falseValue: false, empty: "", nullValue: null };
  assert.equal(safeGet(target, "zero", "fallback"), 0);
  assert.equal(safeGet(target, "falseValue", "fallback"), false);
  assert.equal(safeGet(target, "empty", "fallback"), "");
  assert.equal(safeGet(target, "nullValue", "fallback"), null);
});

test("returns defaultValue when the resolved value is undefined", () => {
  const target = { value: undefined };
  assert.equal(safeGet(target, "value", "fallback"), "fallback");
  assert.equal(safeGet(target, "missing", "fallback"), "fallback");
});

test("blocks __proto__, constructor, and prototype path segments", () => {
  const target = { a: { b: 1 } };
  assert.equal(safeGet(target, "__proto__", "blocked"), "blocked");
  assert.equal(safeGet(target, "__proto__.polluted", "blocked"), "blocked");
  assert.equal(safeGet(target, "constructor", "blocked"), "blocked");
  assert.equal(safeGet(target, "constructor.prototype", "blocked"), "blocked");
  assert.equal(safeGet(target, "a.prototype", "blocked"), "blocked");
  assert.equal(safeGet(target, ["a", "__proto__"], "blocked"), "blocked");
});

test("does not actually pollute the prototype chain", () => {
  const target = {};
  safeGet(target, "__proto__.polluted", "blocked");
  safeGet(target, "constructor.prototype.polluted", "blocked");
  assert.equal({}.polluted, undefined);
  assert.equal(Object.prototype.polluted, undefined);
});

test("traverses Map instances", () => {
  const target = new Map([
    ["user", new Map([["name", "Bob"]])],
  ]);
  assert.equal(safeGet(target, "user.name", "fallback"), "Bob");
  assert.equal(safeGet(target, ["user", "name"], "fallback"), "Bob");
  assert.equal(safeGet(target, "user.missing", "fallback"), "fallback");
});

test("traverses Maps with numeric keys via string paths", () => {
  const target = new Map([[0, "zero"], [1, "one"]]);
  assert.equal(safeGet(target, "0", "fallback"), "zero");
  assert.equal(safeGet(target, [1], "fallback"), "one");
});

test("stops safely without throwing when hitting a primitive mid-path", () => {
  const target = { a: 5 };
  assert.equal(safeGet(target, "a.b.c", "fallback"), "fallback");
  assert.equal(safeGet({ a: "str" }, "a.length.toFixed", "fallback"), "fallback");
  assert.equal(safeGet({ a: null }, "a.b", "fallback"), "fallback");
});

test("returns defaultValue for an empty or invalid path", () => {
  const target = { a: 1 };
  assert.equal(safeGet(target, "", "fallback"), "fallback");
  assert.equal(safeGet(target, [], "fallback"), "fallback");
});
