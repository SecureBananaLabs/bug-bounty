import test from "node:test";
import assert from "node:assert/strict";
import { parseQueryString } from "../utils/parseQueryString.js";

test("parses a basic key=value pair", () => {
  assert.deepEqual(parseQueryString("foo=bar"), { foo: "bar" });
});

test("strips a leading ? prefix", () => {
  assert.deepEqual(parseQueryString("?foo=bar"), { foo: "bar" });
});

test("strips a leading # prefix", () => {
  assert.deepEqual(parseQueryString("#foo=bar"), { foo: "bar" });
});

test("returns an empty object for empty input", () => {
  assert.deepEqual(parseQueryString(""), {});
  assert.deepEqual(parseQueryString("?"), {});
});

test("returns an empty object for non-string input", () => {
  assert.deepEqual(parseQueryString(undefined), {});
  assert.deepEqual(parseQueryString(null), {});
  assert.deepEqual(parseQueryString(42), {});
});

test("decodes percent-encoded keys and values", () => {
  assert.deepEqual(parseQueryString("na%20me=J%2Fane"), { "na me": "J/ane" });
});

test("falls back gracefully on malformed percent encoding", () => {
  assert.deepEqual(parseQueryString("foo=%E0%A4%A"), { foo: "%E0%A4%A" });
  assert.deepEqual(parseQueryString("%=bar"), { "%": "bar" });
});

test("blocks __proto__ injection", () => {
  const result = parseQueryString("__proto__=polluted&safe=1");
  assert.deepEqual(result, { safe: "1" });
  assert.equal(Object.getPrototypeOf({}).polluted, undefined);
});

test("blocks constructor and prototype injection", () => {
  const result = parseQueryString("constructor=x&prototype=y&safe=1");
  assert.deepEqual(result, { safe: "1" });
});

test("blocks encoded prototype pollution keys after decoding", () => {
  const result = parseQueryString("%5F%5Fproto%5F%5F=polluted&safe=1");
  assert.deepEqual(result, { safe: "1" });
});

test("accumulates repeated keys into an array", () => {
  assert.deepEqual(parseQueryString("tags=a&tags=b&tags=c"), {
    tags: ["a", "b", "c"],
  });
});

test("treats a valueless key as a boolean flag", () => {
  assert.deepEqual(parseQueryString("active"), { active: true });
  assert.deepEqual(parseQueryString("active&name=bob"), {
    active: true,
    name: "bob",
  });
});

test("does not coerce types by default", () => {
  assert.deepEqual(parseQueryString("count=5&enabled=true"), {
    count: "5",
    enabled: "true",
  });
});

test("coerces numeric strings when parseNumbers is enabled", () => {
  assert.deepEqual(
    parseQueryString("count=5&price=3.5&negative=-2", { parseNumbers: true }),
    { count: 5, price: 3.5, negative: -2 },
  );
});

test("leaves non-numeric strings alone when parseNumbers is enabled", () => {
  assert.deepEqual(parseQueryString("name=bob5", { parseNumbers: true }), {
    name: "bob5",
  });
});

test("coerces boolean strings when parseBooleans is enabled", () => {
  assert.deepEqual(
    parseQueryString("enabled=true&disabled=false", { parseBooleans: true }),
    { enabled: true, disabled: false },
  );
});

test("combines parseBooleans and parseNumbers", () => {
  assert.deepEqual(
    parseQueryString("enabled=true&count=3", {
      parseBooleans: true,
      parseNumbers: true,
    }),
    { enabled: true, count: 3 },
  );
});

test("handles a value containing an equals sign", () => {
  assert.deepEqual(parseQueryString("token=abc=def"), { token: "abc=def" });
});

test("ignores empty pairs from stray ampersands", () => {
  assert.deepEqual(parseQueryString("a=1&&b=2&"), { a: "1", b: "2" });
});

test("ignores pairs with an empty key", () => {
  assert.deepEqual(parseQueryString("=value&a=1"), { a: "1" });
});
