import test from "node:test";
import assert from "node:assert/strict";
import { uploadFile } from "../controllers/uploadController.js";

test("uploadController - uploadFile", async (t) => {
  await t.test("returns 201 and uploaded status when file is provided", async () => {
    const req = {
      file: { originalname: "test.txt" }
    };

    const res = {
      statusCode: null,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      }
    };

    await uploadFile(req, res);

    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.jsonData, {
      success: true,
      data: {
        filename: "test.txt",
        status: "uploaded"
      }
    });
  });

  await t.test("returns 400 when no file is provided", async () => {
    const req = {};

    const res = {
      statusCode: null,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      }
    };

    await uploadFile(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.jsonData, {
      success: false,
      message: "Missing file submission"
    });
  });
});
