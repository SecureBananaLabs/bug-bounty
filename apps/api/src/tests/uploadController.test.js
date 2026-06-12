import test from "node:test";
import assert from "node:assert/strict";
import { uploadFile } from "../controllers/uploadController.js";

function createResponse() {
  const response = {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    }
  };

  return response;
}

test("uploadFile sanitizes path-like filenames in the response", async () => {
  const res = createResponse();

  await uploadFile({ file: { originalname: "../secret.txt" } }, res);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.payload, {
    success: true,
    data: {
      filename: "secret.txt",
      status: "uploaded"
    }
  });
});

test("uploadFile sanitizes control characters in the response", async () => {
  const res = createResponse();

  await uploadFile({ file: { originalname: "  final\nname.txt  " } }, res);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.payload, {
    success: true,
    data: {
      filename: "finalname.txt",
      status: "uploaded"
    }
  });
});
