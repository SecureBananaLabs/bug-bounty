import { describe, it, expect } from "vitest";
import { truncate, slugify, escapeRegex } from "../utils/stringUtils.js";

describe("stringUtils (#13893)", () => {
  describe("truncate", () => {
    it("should return string as-is if under limit", () => {
      expect(truncate("hello", 10)).toBe("hello");
    });

    it("should truncate at maxLength with ellipsis", () => {
      expect(truncate("hello world", 8)).toBe("hello...");
    });

    it("should handle empty string", () => {
      expect(truncate("", 10)).toBe("");
    });

    it("should handle non-string input", () => {
      expect(truncate(123, 10)).toBe("");
    });

    it("should strip control characters", () => {
      expect(truncate("hello\x00world", 20)).toBe("helloworld");
    });

    it("should return ellipsis-only when maxLength <= ellipsis length", () => {
      expect(truncate("hello world", 3)).toBe("...");
    });
  });

  describe("slugify", () => {
    it("should lowercase and replace spaces with hyphens", () => {
      expect(slugify("Hello World")).toBe("hello-world");
    });

    it("should strip special characters", () => {
      expect(slugify("Hello, World! 2024")).toBe("hello-world-2024");
    });

    it("should collapse multiple separators", () => {
      expect(slugify("Hello   ---   World")).toBe("hello-world");
    });

    it("should handle empty string", () => {
      expect(slugify("")).toBe("");
    });

    it("should strip control characters", () => {
      expect(slugify("test\x00value")).toBe("testvalue");
    });
  });

  describe("escapeRegex", () => {
    it("should escape regex metacharacters", () => {
      expect(escapeRegex("a.b*c?d+e[f]g{h}i(j)k|l^m$n\\o")).toBe(
        "a\\.b\\*c\\?d\\+e\\[f\\]g\\{h\\}i\\(j\\)k\\|l\\^m\\$n\\\\o"
      );
    });

    it("should return empty for non-string", () => {
      expect(escapeRegex(null)).toBe("");
    });

    it("should pass through safe strings unchanged", () => {
      expect(escapeRegex("hello world 123")).toBe("hello world 123");
    });
  });
});
