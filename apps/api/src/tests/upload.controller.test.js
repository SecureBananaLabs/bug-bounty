import test from "node:test";
import assert from "node:assert/strict";
import { uploadFile } from "../controllers/uploadController.js";

function createResponseRecorder() {
  return {
    statusCode: 200,
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

test("uploadFile rejects requests without a file", async () => {
  const res = createResponseRecorder();

  await uploadFile({}, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    success: false,
    message: "File is required"
  });
});

test("uploadFile preserves the existing success response for valid uploads", async () => {
  const res = createResponseRecorder();

  await uploadFile({
    file: {
      originalname: "avatar.png"
    }
  }, res);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, {
    success: true,
    data: {
      filename: "avatar.png",
      status: "uploaded"
    }
  });
});
