import { describe, it, expect } from "vitest";
import { parsePort } from "../config/env.js";

describe("parsePort", () => {
  it("returns default when value is undefined", () => {
    expect(parsePort(undefined, 4000)).toBe(4000);
  });

  it("returns default when value is null", () => {
    expect(parsePort(null, 4000)).toBe(4000);
  });

  it("returns default when value is empty string", () => {
    expect(parsePort("", 4000)).toBe(4000);
  });

  it("parses a valid port string", () => {
    expect(parsePort("3000")).toBe(3000);
  });

  it("parses a valid port number", () => {
    expect(parsePort(8080)).toBe(8080);
  });

  it("accepts port 1 (minimum)", () => {
    expect(parsePort("1")).toBe(1);
  });

  it("accepts port 65535 (maximum)", () => {
    expect(parsePort("65535")).toBe(65535);
  });

  it("rejects port 0", () => {
    expect(() => parsePort("0")).toThrow(/Invalid PORT/);
  });

  it("rejects negative port", () => {
    expect(() => parsePort("-1")).toThrow(/Invalid PORT/);
  });

  it("rejects port above 65535", () => {
    expect(() => parsePort("70000")).toThrow(/Invalid PORT/);
  });

  it("rejects fractional port", () => {
    expect(() => parsePort("80.5")).toThrow(/Invalid PORT/);
  });

  it("rejects NaN string", () => {
    expect(() => parsePort("abc")).toThrow(/Invalid PORT/);
  });

  it("rejects empty-string-ish whitespace", () => {
    expect(() => parsePort("  ")).toThrow(/Invalid PORT/);
  });
});
