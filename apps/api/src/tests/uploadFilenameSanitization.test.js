import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeUploadFilename, uploadFile } from "../controllers/uploadController.js";

function createResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

test("sanitizeUploadFilename strips paths, controls, whitespace, and long metadata", () => {
  assert.equal(sanitizeUploadFilename("../secret.txt"), "secret.txt");
  assert.equal(sanitizeUploadFilename("nested\\path\\invoice\n2026.pdf"), "invoice2026.pdf");
  assert.equal(sanitizeUploadFilename("  report\tfinal.csv  "), "reportfinal.csv");
  assert.equal(sanitizeUploadFilename("a".repeat(150)).length, 120);
});

test("uploadFile returns sanitized filename metadata", async () => {
  const res = createResponse();

  await uploadFile({
    file: {
      originalname: "../private\nstatement.pdf"
    }
  }, res);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, {
    success: true,
    data: {
      filename: "privatestatement.pdf",
      status: "uploaded"
    }
  });
});
