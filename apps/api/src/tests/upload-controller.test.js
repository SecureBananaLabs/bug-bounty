import test from "node:test";
import assert from "node:assert/strict";
import { uploadFile } from "../controllers/uploadController.js";

function createResponse() {
  return {
    statusCode: undefined,
    payload: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    }
  };
}

test("uploadFile rejects requests without a file", async () => {
  const res = createResponse();

  await uploadFile({}, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.payload, {
    success: false,
    message: "File is required"
  });
});

test("uploadFile accepts uploaded files", async () => {
  const res = createResponse();

  await uploadFile({ file: { originalname: "brief.pdf" } }, res);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.payload, {
    success: true,
    data: {
      filename: "brief.pdf",
      status: "uploaded"
    }
  });
});
