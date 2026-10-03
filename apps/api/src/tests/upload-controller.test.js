import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeFilename, uploadFile } from "../controllers/uploadController.js";

function createResponseDouble() {
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

test("sanitizeFilename keeps only the final path segment and removes control characters", () => {
  assert.equal(sanitizeFilename(" ..\\reports\\quarterly.pdf\r\n "), "quarterly.pdf");
  assert.equal(sanitizeFilename("../secret.txt"), "secret.txt");
});

test("sanitizeFilename caps returned metadata length", () => {
  const sanitized = sanitizeFilename(`${"a".repeat(150)}.pdf`);

  assert.equal(sanitized.length, 100);
});

test("uploadFile returns the sanitized filename in the response payload", async () => {
  const res = createResponseDouble();

  await uploadFile(
    {
      file: {
        originalname: " ../contracts/final-agreement.pdf\r\n "
      }
    },
    res
  );

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, {
    success: true,
    data: {
      filename: "final-agreement.pdf",
      status: "uploaded"
    }
  });
});
