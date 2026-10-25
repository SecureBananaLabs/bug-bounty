import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const routeSrc = fs.readFileSync(
  path.join(__dirname, "../routes/uploadRoutes.js"),
  "utf-8"
);

test("upload route imports authMiddleware", () => {
  assert.ok(routeSrc.includes("authMiddleware"), "should import authMiddleware");
  assert.ok(routeSrc.includes("import { authMiddleware }"), "should import from auth middleware");
});

test("authMiddleware is applied before multer in route stack", () => {
  const lines = routeSrc.split("\n");
  const postLine = lines.find(l => l.includes(".post("));
  assert.ok(postLine, "should have a .post() route definition");
  const authIdx = postLine.indexOf("authMiddleware");
  const uploadIdx = postLine.indexOf("upload.single");
  assert.ok(authIdx > 0, "authMiddleware should appear in post line");
  assert.ok(uploadIdx > 0, "upload.single should appear in post line");
  assert.ok(authIdx < uploadIdx, "auth comes before file handler in middleware chain");
});

test("upload route file still handles multipart upload", () => {
  assert.ok(routeSrc.includes("upload.single"), "should still use multer upload.single");
  assert.ok(routeSrc.includes("uploadFile"), "should still call uploadFile controller");
});
