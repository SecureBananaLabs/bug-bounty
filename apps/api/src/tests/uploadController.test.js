import test from "node:test";
import assert from "node:assert/strict";
import { uploadFile } from "../controllers/uploadController.js";

function createResponse() {
  const response = {
    statusCode: undefined,
    body: undefined,
    status(code) {
      response.statusCode = code;
      return response;
    },
    json(payload) {
      response.body = payload;
      return response;
    }
  };

  return response;
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
