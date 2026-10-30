import test from "node:test";
import assert from "node:assert/strict";
import { uploadFile } from "../controllers/uploadController.js";

function mockRes() {
  const res = {
    status: null,
    body: null,
    status(code) {
      res.status = code;
      return res;
    },
    json(data) {
      res.body = data;
      return res;
    },
  };
  return res;
}

test("POST /upload returns 400 when no file is provided", async () => {
  const req = { file: undefined };
  const res = mockRes();

  await uploadFile(req, res);

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, "No file provided");
});

test("POST /upload returns 201 with file info when file is provided", async () => {
  const req = {
    file: {
      originalname: "test.txt",
      mimetype: "text/plain",
      size: 1024,
    },
  };
  const res = mockRes();

  await uploadFile(req, res);

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.filename, "test.txt");
  assert.equal(res.body.data.status, "uploaded");
});
