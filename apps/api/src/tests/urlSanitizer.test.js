import test from "node:test";
import assert from "node:assert/strict";
import { isSafeUrl, sanitizeUrl, isPrivateHostname } from "../utils/urlSanitizer.js";

test("valid public URLs pass validation", () => {
  assert.equal(isSafeUrl("https://freelanceflow.dev/profiles/dev1"), true);
  assert.equal(isSafeUrl("http://example.com/portfolio?sort=asc"), true);
  assert.equal(sanitizeUrl("https://example.com/project"), "https://example.com/project");
});

test("dangerous script pseudo-protocols are rejected", () => {
  assert.equal(isSafeUrl("javascript:alert(1)"), false);
  assert.equal(isSafeUrl("JAVASCRIPT:alert('xss')"), false);
  assert.equal(isSafeUrl("data:text/html,<script>alert(1)</script>"), false);
  assert.equal(isSafeUrl("file:///etc/passwd"), false);
  assert.equal(isSafeUrl("vbscript:msgbox(1)"), false);
  assert.equal(sanitizeUrl("javascript:void(0)", "https://default.com"), "https://default.com");
});

test("SSRF and private / loopback IP ranges are rejected", () => {
  assert.equal(isSafeUrl("http://127.0.0.1:3000/api"), false);
  assert.equal(isSafeUrl("http://localhost:8080"), false);
  assert.equal(isSafeUrl("http://169.254.169.254/latest/meta-data/"), false);
  assert.equal(isSafeUrl("http://10.0.0.1"), false);
  assert.equal(isSafeUrl("http://172.16.0.1"), false);
  assert.equal(isSafeUrl("http://192.168.1.1"), false);
  assert.equal(isSafeUrl("http://[::1]:8080"), false);
});

test("CRLF injection is rejected", () => {
  assert.equal(isSafeUrl("https://example.com\r\nSet-Cookie:admin=1"), false);
  assert.equal(isSafeUrl("https://example.com\nLocation:evil.com"), false);
});

test("malformed URLs and null inputs return fallback safely", () => {
  assert.equal(isSafeUrl(""), false);
  assert.equal(isSafeUrl(null), false);
  assert.equal(isSafeUrl("not a valid url"), false);
  assert.equal(sanitizeUrl("invalid", null), null);
});

test("IPv6 mapped loopback, private and link-local addresses are rejected", () => {
  for (const host of ["::ffff:127.0.0.1", "::ffff:10.0.0.1", "::ffff:169.254.169.254", "febf::1"]) {
    assert.equal(isSafeUrl(`http://[${host}]/`), false, host);
  }
  assert.equal(isSafeUrl("https://[::ffff:8.8.8.8]/"), true);
});

test("ordinary public domain prefixes are not confused with IPv6 ranges", () => {
  for (const host of ["fdocs.example.com", "fc-example.com", "fe80.example.com"]) {
    assert.equal(isSafeUrl(`https://${host}/`), true, host);
  }
  assert.equal(isSafeUrl("http://localhost./"), false);
});

test("leading and trailing CRLF are rejected before whitespace normalization", () => {
  assert.equal(isSafeUrl("\r\nhttps://example.com"), false);
  assert.equal(isSafeUrl("https://example.com\n"), false);
});
