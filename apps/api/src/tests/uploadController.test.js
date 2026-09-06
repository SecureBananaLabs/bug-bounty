import test from "node:test";
import assert from "node:assert/strict";
import { uploadFile } from "../controllers/uploadController.js";

function createMockResponse() {
  return {
    statusCode: undefined,
    body: undefined,
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

test("uploadFile rejects requests without a file", async () => {
  const res = createMockResponse();

  await uploadFile({}, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    success: false,
    message: "File is required"
  });
});

test("uploadFile returns uploaded status when a file is present", async () => {
  const res = createMockResponse();

  await uploadFile({ file: { originalname: "brief.pdf" } }, res);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, {
    success: true,
    data: {
      filename: "brief.pdf",
      status: "uploaded"
    }
  });
});
