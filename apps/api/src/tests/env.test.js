import test from "node:test";
import assert from "node:assert/strict";
import { parsePort } from "../config/env.js";

test("parsePort returns default when value is undefined", () => {
  assert.equal(parsePort(undefined, 4000), 4000);
});

test("parsePort returns default when value is invalid string", () => {
  assert.equal(parsePort("abc", 4000), 4000);
});

test("parsePort returns default when value is NaN", () => {
  assert.equal(parsePort("NaN", 4000), 4000);
});

test("parsePort returns default when value is negative", () => {
  assert.equal(parsePort("-1", 4000), 4000);
});

test("parsePort returns default when value is too large", () => {
  assert.equal(parsePort("65536", 4000), 4000);
});

test("parsePort accepts valid port 0", () => {
  assert.equal(parsePort("0", 4000), 0);
});

test("parsePort accepts valid port 8080", () => {
  assert.equal(parsePort("8080", 4000), 8080);
});

test("parsePort accepts valid port 65535", () => {
  assert.equal(parsePort("65535", 4000), 65535);
});

test("parsePort returns default when value is float", () => {
  assert.equal(parsePort("8080.5", 4000), 4000);
});

test("parsePort accepts numeric value", () => {
  assert.equal(parsePort(3000, 4000), 3000);
});
