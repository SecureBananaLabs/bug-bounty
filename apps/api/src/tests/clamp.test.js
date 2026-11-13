import test from "node:test";
import assert from "node:assert/strict";
import clamp, { clamp01, clampInt, toFiniteNumber, isNumeric } from "../utils/clamp.js";

test("clamp - basic numeric clamping within inclusive bounds", async (t) => {
  await t.test("preserves value already within [min, max] range", () => {
    assert.equal(clamp(5, 0, 10), 5);
    assert.equal(clamp(0, 0, 10), 0);
    assert.equal(clamp(10, 0, 10), 10);
    assert.equal(clamp(2.5, 0, 5), 2.5);
  });

  await t.test("clamps value exceeding max down to max", () => {
    assert.equal(clamp(15, 0, 10), 10);
    assert.equal(clamp(100.5, 0, 10), 10);
    assert.equal(clamp(500, -100, 100), 100);
  });

  await t.test("clamps value below min up to min", () => {
    assert.equal(clamp(-5, 0, 10), 0);
    assert.equal(clamp(-100, 0, 10), 0);
    assert.equal(clamp(-250, -100, 100), -100);
  });

  await t.test("handles negative bounds correctly", () => {
    assert.equal(clamp(-15, -20, -10), -15);
    assert.equal(clamp(-25, -20, -10), -20);
    assert.equal(clamp(-5, -20, -10), -10);
  });

  await t.test("handles equal bounds (min === max)", () => {
    assert.equal(clamp(10, 5, 5), 5);
    assert.equal(clamp(-10, 5, 5), 5);
    assert.equal(clamp(5, 5, 5), 5);
    assert.equal(clamp(5, 0, 0), 0);
  });

  await t.test("handles floating point precision numbers", () => {
    const val = 0.1 + 0.2;
    assert.equal(clamp(val, 0, 1), val);
    assert.equal(clamp(Math.PI, 0, 3), 3);
    assert.equal(clamp(Math.E, 2, 3), Math.E);
  });

  await t.test("defaults to [0, 1] when min and max are omitted", () => {
    assert.equal(clamp(0.5), 0.5);
    assert.equal(clamp(1.5), 1);
    assert.equal(clamp(-0.5), 0);
  });

  await t.test("normalizes negative zero (-0) to positive zero (+0)", () => {
    const result = clamp(-0, -5, 5);
    assert.equal(result, 0);
    assert.equal(Object.is(result, 0), true);
    assert.equal(Object.is(result, -0), false);
  });
});

test("clamp - auto-swaps inverted bounds (min > max)", async (t) => {
  await t.test("auto-swaps inverted bounds with value inside range", () => {
    assert.equal(clamp(5, 10, 0), 5);
    assert.equal(clamp(7.5, 20, 5), 7.5);
  });

  await t.test("auto-swaps inverted bounds with value below swapped min", () => {
    assert.equal(clamp(-5, 10, 0), 0);
    assert.equal(clamp(2, 20, 5), 5);
  });

  await t.test("auto-swaps inverted bounds with value above swapped max", () => {
    assert.equal(clamp(15, 10, 0), 10);
    assert.equal(clamp(25, 20, 5), 20);
  });

  await t.test("auto-swaps negative inverted bounds", () => {
    assert.equal(clamp(-15, -10, -20), -15);
    assert.equal(clamp(-25, -10, -20), -20);
    assert.equal(clamp(-5, -10, -20), -10);
  });

  await t.test("auto-swaps inverted floating point bounds", () => {
    assert.equal(clamp(2.5, 5.5, 1.5), 2.5);
    assert.equal(clamp(0.5, 5.5, 1.5), 1.5);
    assert.equal(clamp(6.5, 5.5, 1.5), 5.5);
  });
});

test("clamp - parses numeric strings safely", async (t) => {
  await t.test("parses integer string value and returns number type", () => {
    const res = clamp("42", 0, 100);
    assert.equal(res, 42);
    assert.equal(typeof res, "number");
  });

  await t.test("parses float numeric string safely", () => {
    assert.equal(clamp("42.5", 0, 100), 42.5);
    assert.equal(clamp("-13.37", -50, 0), -13.37);
  });

  await t.test("trims leading and trailing whitespace in numeric strings", () => {
    assert.equal(clamp("   75.5   ", 0, 100), 75.5);
    assert.equal(clamp("\t -10 \n", -50, 50), -10);
  });

  await t.test("parses scientific notation strings safely", () => {
    assert.equal(clamp("1e3", 0, 2000), 1000);
    assert.equal(clamp("1.5e2", 0, 200), 150);
  });

  await t.test("parses hexadecimal numeric strings", () => {
    assert.equal(clamp("0x1f", 0, 100), 31);
    assert.equal(clamp("0xff", 0, 500), 255);
  });

  await t.test("safely parses numeric string bounds", () => {
    assert.equal(clamp(5, "0", "10"), 5);
    assert.equal(clamp(15, "0", "10"), 10);
    assert.equal(clamp(-5, "0", "10"), 0);
  });

  await t.test("auto-swaps inverted numeric string bounds", () => {
    assert.equal(clamp(5, "10", "0"), 5);
    assert.equal(clamp(15, "10", "0"), 10);
    assert.equal(clamp(-5, "10", "0"), 0);
  });
});

test("clamp - handles NaN, Infinity, -Infinity, null, undefined, and non-numeric types", async (t) => {
  await t.test("returns defaultValue (defaults to min) for NaN", () => {
    assert.equal(clamp(NaN, 0, 10), 0);
    assert.equal(clamp(NaN, 10, 20), 10);
  });

  await t.test("returns defaultValue (defaults to min) for Infinity and -Infinity", () => {
    assert.equal(clamp(Infinity, 0, 10), 0);
    assert.equal(clamp(-Infinity, 0, 10), 0);
    assert.equal(clamp(Infinity, 10, 20), 10);
    assert.equal(clamp(-Infinity, 10, 20), 10);
  });

  await t.test("returns defaultValue (defaults to min) for null and undefined", () => {
    assert.equal(clamp(null, 0, 10), 0);
    assert.equal(clamp(undefined, 0, 10), 0);
    assert.equal(clamp(null, 10, 20), 10);
    assert.equal(clamp(undefined, 10, 20), 10);
  });

  await t.test("returns defaultValue for non-numeric strings", () => {
    assert.equal(clamp("abc", 0, 10), 0);
    assert.equal(clamp("12px", 0, 10), 0);
    assert.equal(clamp("", 0, 10), 0);
    assert.equal(clamp("   ", 0, 10), 0);
    assert.equal(clamp("NaN", 0, 10), 0);
    assert.equal(clamp("Infinity", 0, 10), 0);
  });

  await t.test("returns defaultValue for booleans, objects, arrays, and symbols", () => {
    assert.equal(clamp(true, 0, 10), 0);
    assert.equal(clamp(false, 0, 10), 0);
    assert.equal(clamp([], 0, 10), 0);
    assert.equal(clamp([42], 0, 10), 0);
    assert.equal(clamp({}, 0, 10), 0);
    assert.equal(clamp({ valueOf: () => 42 }, 0, 10), 0);
    assert.equal(clamp(() => 42, 0, 10), 0);
    assert.equal(clamp(Symbol("num"), 0, 10), 0);
  });

  await t.test("uses explicitly provided defaultValue for invalid inputs", () => {
    assert.equal(clamp(NaN, 0, 10, 7), 7);
    assert.equal(clamp(Infinity, 0, 10, 5), 5);
    assert.equal(clamp(-Infinity, 0, 10, 3), 3);
    assert.equal(clamp(null, 0, 10, 4), 4);
    assert.equal(clamp(undefined, 0, 10, 8), 8);
    assert.equal(clamp("invalid", 0, 10, 6), 6);
  });

  await t.test("safely clamps defaultValue itself if it exceeds bounds", () => {
    assert.equal(clamp(NaN, 0, 10, 25), 10);
    assert.equal(clamp(NaN, 0, 10, -5), 0);
    assert.equal(clamp(null, 10, 20, 5), 10);
    assert.equal(clamp(undefined, 10, 20, 35), 20);
  });

  await t.test("safely parses numeric string defaultValue", () => {
    assert.equal(clamp(NaN, 0, 10, "5.5"), 5.5);
    assert.equal(clamp(null, 0, 10, " 8 "), 8);
  });

  await t.test("falls back safely to lower bound when defaultValue is also invalid", () => {
    assert.equal(clamp(NaN, 0, 10, NaN), 0);
    assert.equal(clamp(null, 5, 15, "invalid"), 5);
    assert.equal(clamp(undefined, 5, 15, null), 5);
    assert.equal(clamp(Infinity, 5, 15, undefined), 5);
  });

  await t.test("preserves defaultValue with inverted bounds", () => {
    assert.equal(clamp(NaN, 20, 10), 20);
    assert.equal(clamp(NaN, 20, 10, 15), 15);
    assert.equal(clamp(NaN, 20, 10, 5), 10);
    assert.equal(clamp(NaN, 20, 10, 30), 20);
  });
});

test("clamp01 - unit interval [0, 1] clamping", async (t) => {
  await t.test("preserves values between 0 and 1 inclusive", () => {
    assert.equal(clamp01(0), 0);
    assert.equal(clamp01(1), 1);
    assert.equal(clamp01(0.5), 0.5);
    assert.equal(clamp01(0.12345), 0.12345);
  });

  await t.test("clamps negative values up to 0", () => {
    assert.equal(clamp01(-0.01), 0);
    assert.equal(clamp01(-5), 0);
    assert.equal(clamp01(-1000), 0);
  });

  await t.test("clamps values greater than 1 down to 1", () => {
    assert.equal(clamp01(1.01), 1);
    assert.equal(clamp01(5), 1);
    assert.equal(clamp01(1000), 1);
  });

  await t.test("parses numeric strings safely", () => {
    assert.equal(clamp01("0.75"), 0.75);
    assert.equal(clamp01("1.5"), 1);
    assert.equal(clamp01("-0.5"), 0);
  });

  await t.test("handles non-numeric and non-finite inputs by returning 0", () => {
    assert.equal(clamp01(NaN), 0);
    assert.equal(clamp01(Infinity), 0);
    assert.equal(clamp01(-Infinity), 0);
    assert.equal(clamp01(null), 0);
    assert.equal(clamp01(undefined), 0);
    assert.equal(clamp01("invalid"), 0);
    assert.equal(clamp01([]), 0);
    assert.equal(clamp01({}), 0);
    assert.equal(clamp01(true), 0);
  });
});

test("clampInt - integer clamping and rounding", async (t) => {
  await t.test("preserves exact integers within bounds", () => {
    assert.equal(clampInt(5, 0, 10), 5);
    assert.equal(clampInt(0, 0, 10), 0);
    assert.equal(clampInt(10, 0, 10), 10);
    assert.equal(clampInt(-5, -10, 0), -5);
  });

  await t.test("rounds floats to nearest integer within bounds", () => {
    assert.equal(clampInt(5.4, 0, 10), 5);
    assert.equal(clampInt(5.6, 0, 10), 6);
    assert.equal(clampInt(5.5, 0, 10), 6);
    assert.equal(clampInt(0.4, 0, 10), 0);
  });

  await t.test("clamps out-of-range floats to bounds", () => {
    assert.equal(clampInt(15.8, 0, 10), 10);
    assert.equal(clampInt(-5.2, 0, 10), 0);
  });

  await t.test("auto-swaps inverted bounds for integer clamp", () => {
    assert.equal(clampInt(5, 10, 0), 5);
    assert.equal(clampInt(5.6, 10, 0), 6);
    assert.equal(clampInt(15, 10, 0), 10);
    assert.equal(clampInt(-5, 10, 0), 0);
  });

  await t.test("parses numeric strings and returns integers", () => {
    const res1 = clampInt("7", 0, 10);
    assert.equal(res1, 7);
    assert.equal(typeof res1, "number");

    const res2 = clampInt("7.8", 0, 10);
    assert.equal(res2, 8);
  });

  await t.test("respects fractional bounds while guaranteeing integer results within bounds", () => {
    // Bounds [1.2, 5.8] -> valid integers are [2, 5]
    assert.equal(clampInt(7.5, 1.2, 5.8), 5);
    assert.equal(clampInt(0.5, 1.2, 5.8), 2);
    assert.equal(clampInt(3.4, 1.2, 5.8), 3);
    assert.equal(clampInt(3.8, 1.2, 5.8), 4);
  });

  await t.test("handles NaN, Infinity, null, undefined in clampInt", () => {
    assert.equal(clampInt(NaN, 1, 10), 1);
    assert.equal(clampInt(Infinity, 1, 10), 1);
    assert.equal(clampInt(-Infinity, 1, 10), 1);
    assert.equal(clampInt(null, 1, 10), 1);
    assert.equal(clampInt(undefined, 1, 10), 1);
    assert.equal(clampInt("invalid", 1, 10), 1);
  });

  await t.test("uses defaultValue and rounds to integer in clampInt", () => {
    assert.equal(clampInt(NaN, 1, 10, 5), 5);
    assert.equal(clampInt(null, 1, 10, 5.7), 6);
    assert.equal(clampInt(undefined, 1, 10, 15), 10);
    assert.equal(clampInt(NaN, 1, 10, -5), 1);
  });
});

test("toFiniteNumber and isNumeric helpers", async (t) => {
  await t.test("toFiniteNumber returns finite numbers correctly", () => {
    assert.equal(toFiniteNumber(42), 42);
    assert.equal(toFiniteNumber(-13.37), -13.37);
    assert.equal(toFiniteNumber(0), 0);
    assert.equal(toFiniteNumber("100"), 100);
    assert.equal(toFiniteNumber("  -50.5  "), -50.5);
  });

  await t.test("toFiniteNumber rejects non-finite and invalid inputs with null", () => {
    assert.equal(toFiniteNumber(NaN), null);
    assert.equal(toFiniteNumber(Infinity), null);
    assert.equal(toFiniteNumber(-Infinity), null);
    assert.equal(toFiniteNumber(null), null);
    assert.equal(toFiniteNumber(undefined), null);
    assert.equal(toFiniteNumber(""), null);
    assert.equal(toFiniteNumber("   "), null);
    assert.equal(toFiniteNumber("abc"), null);
    assert.equal(toFiniteNumber(true), null);
    assert.equal(toFiniteNumber(false), null);
    assert.equal(toFiniteNumber([]), null);
    assert.equal(toFiniteNumber({}), null);
    assert.equal(toFiniteNumber(Symbol("test")), null);
  });

  await t.test("handles boxed Number and String objects", () => {
    assert.equal(toFiniteNumber(new Number(42)), 42);
    assert.equal(toFiniteNumber(new String("99.9")), 99.9);
  });

  await t.test("isNumeric returns accurate boolean indicator", () => {
    assert.equal(isNumeric(42), true);
    assert.equal(isNumeric("42.5"), true);
    assert.equal(isNumeric(0), true);
    assert.equal(isNumeric(NaN), false);
    assert.equal(isNumeric(Infinity), false);
    assert.equal(isNumeric(null), false);
    assert.equal(isNumeric(undefined), false);
    assert.equal(isNumeric("abc"), false);
    assert.equal(isNumeric(""), false);
  });
});

test("clamp - export structure and compatibility", async (t) => {
  await t.test("clamp is both default export and callable object with method properties", () => {
    assert.equal(typeof clamp, "function");
    assert.equal(typeof clamp.clamp01, "function");
    assert.equal(typeof clamp.clampInt, "function");
    assert.equal(typeof clamp.toFiniteNumber, "function");
    assert.equal(typeof clamp.isNumeric, "function");
  });

  await t.test("clamp method properties produce identical results to named exports", () => {
    assert.equal(clamp.clamp01(0.7), clamp01(0.7));
    assert.equal(clamp.clampInt(4.6, 0, 10), clampInt(4.6, 0, 10));
    assert.equal(clamp.toFiniteNumber("123"), toFiniteNumber("123"));
    assert.equal(clamp.isNumeric("123"), isNumeric("123"));
  });
});

test("clamp - advanced edge cases and robustness hardening", async (t) => {
  await t.test("supports BigInt values safely across clamp and clampInt", () => {
    assert.equal(clamp(10n, 0, 20), 10);
    assert.equal(clamp(50n, 0, 20), 20);
    assert.equal(clamp(-10n, 0, 20), 0);
    assert.equal(clamp(15, 0n, 10n), 10);
    assert.equal(clamp(5, 10n, 0n), 5);
    assert.equal(clamp(NaN, 0, 20, 15n), 15);
    assert.equal(clampInt(42n, 0, 100), 42);
    assert.equal(toFiniteNumber(100n), 100);
    assert.equal(isNumeric(100n), true);
  });

  await t.test("safely handles null/undefined bounds without degenerate point collapse", () => {
    // clamp(5, 10, null) should use bounds [1, 10] after auto-swap, not collapse to [10, 10]
    assert.equal(clamp(5, 10, null), 5);
    assert.equal(clamp(15, 10, null), 10);
    assert.equal(clamp(0, 10, null), 1);

    // clamp(-2, null, -5) should use bounds [-5, 0] after auto-swap, not collapse to [-5, -5]
    assert.equal(clamp(-2, null, -5), -2);
    assert.equal(clamp(-10, null, -5), -5);
    assert.equal(clamp(5, null, -5), 0);
  });

  await t.test("handles clampInt with fractional bounds containing no integers", () => {
    // Bounds [2.4, 2.6] contain no integers strictly inside; should clamp to nearest rounded boundary integer
    assert.equal(clampInt(2.5, 2.4, 2.6), 3);
    assert.equal(clampInt(2.1, 2.4, 2.6), 2);
    assert.equal(clampInt(2.9, 2.4, 2.6), 3);
    assert.equal(clampInt(NaN, 2.4, 2.6), 2);
  });

  await t.test("handles extremely large numbers within IEEE-754 range", () => {
    assert.equal(clamp(1e20, 0, 1e10), 1e10);
    assert.equal(clamp(-1e20, -1e10, 0), -1e10);
    assert.equal(clamp(5e9, 0, 1e10), 5e9);
    assert.equal(clampInt(Number.MAX_SAFE_INTEGER, 0, 1e16), Number.MAX_SAFE_INTEGER);
  });

  await t.test("ensures clamp01 and clampInt normalize -0 to +0", () => {
    const res01 = clamp01(-0);
    assert.equal(res01, 0);
    assert.equal(Object.is(res01, 0), true);
    assert.equal(Object.is(res01, -0), false);

    const resInt = clampInt(-0.2, -5, 5);
    assert.equal(resInt, 0);
    assert.equal(Object.is(resInt, 0), true);
    assert.equal(Object.is(resInt, -0), false);
  });
});

