import test from "node:test";
import assert from "node:assert/strict";
import { uploadFile } from "../controllers/uploadController.js";

function createResponse() {
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

test("uploadFile rejects requests without files", async () => {
  const res = createResponse();

  await uploadFile({}, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { success: false, message: "File is required" });
});

test("uploadFile returns uploaded status for a provided file", async () => {
  const res = createResponse();

  await uploadFile({ file: { originalname: "invoice.pdf" } }, res);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, {
    success: true,
    data: {
      filename: "invoice.pdf",
      status: "uploaded"
    }
  });
});
