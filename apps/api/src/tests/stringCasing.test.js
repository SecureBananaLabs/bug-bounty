import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { camelCase, snakeCase } from "../utils/stringCasing.js";

describe("stringCasing Utility", () => {
    it("converts varied string formats to camelCase", () => {
        assert.equal(camelCase("Foo Bar"), "fooBar");
        assert.equal(camelCase("--foo-bar--"), "fooBar");
        assert.equal(camelCase("__FOO_BAR__"), "fooBar");
        assert.equal(camelCase("XMLHttpRequest"), "xmlHttpRequest");
        assert.equal(camelCase("user_id"), "userId");
    });

    it("converts varied string formats to snake_case", () => {
        assert.equal(snakeCase("Foo Bar"), "foo_bar");
        assert.equal(snakeCase("fooBar"), "foo_bar");
        assert.equal(snakeCase("--FOO-BAR--"), "foo_bar");
        assert.equal(snakeCase("XMLHttpRequest"), "xml_http_request");
        assert.equal(snakeCase("userId123"), "user_id_123");
    });

    it("handles null, undefined, empty, and non-string inputs safely", () => {
        assert.equal(camelCase(null), "");
        assert.equal(camelCase(undefined), "");
        assert.equal(camelCase(""), "");
        assert.equal(snakeCase(null), "");
        assert.equal(snakeCase(undefined), "");
        assert.equal(snakeCase(""), "");
    });
});