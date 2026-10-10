import test from "node:test";
import assert from "node:assert/strict";

import { uploadFile } from "../controllers/uploadController.js";

function createMockResponse() {
  return {
    statusCode: undefined,
    payload: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
}

test("uploadFile rejects requests without a file", async () => {
  const res = createMockResponse();

  await uploadFile({}, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.payload, { success: false, message: "File is required" });
});

test("uploadFile preserves successful upload responses", async () => {
  const res = createMockResponse();

  await uploadFile({ file: { originalname: "proof.txt" } }, res);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.payload, {
    success: true,
    data: {
      filename: "proof.txt",
      status: "uploaded"
    }
  });
});
