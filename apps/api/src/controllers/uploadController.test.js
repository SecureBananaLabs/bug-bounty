import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { uploadFile } from "./uploadController.js";

function mockRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

describe("Upload Controller File Enforcement (#11685)", () => {
  it("rejects upload request without a file (400)", async () => {
    const req = {};
    const res = mockRes();
    await uploadFile(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "No file uploaded");
  });

  it("successfully handles uploaded file (201)", async () => {
    const req = {
      file: {
        originalname: "project_spec.pdf"
      }
    };
    const res = mockRes();
    await uploadFile(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.filename, "project_spec.pdf");
    assert.equal(res.body.data.status, "uploaded");
  });
});
