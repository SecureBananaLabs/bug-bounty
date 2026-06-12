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

test("upload controller rejects missing files", async () => {
  const response = createResponse();

  await uploadFile({}, response);

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, {
    success: false,
    message: "File is required"
  });
});

test("upload controller returns uploaded filename", async () => {
  const response = createResponse();

  await uploadFile({
    file: {
      originalname: "portfolio.pdf"
    }
  }, response);

  assert.equal(response.statusCode, 201);
  assert.deepEqual(response.body, {
    success: true,
    data: {
      filename: "portfolio.pdf",
      status: "uploaded"
    }
  });
});
