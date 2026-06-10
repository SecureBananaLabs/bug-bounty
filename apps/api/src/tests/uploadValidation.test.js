import request from "supertest";
import { createApp } from "../app.js";
import { expect } from "chai";
import fs from "fs";
import path from "path";

describe("Upload API Validation", () => {
  let app;
  const testFilePath = path.join(process.cwd(), "test-file.txt");

  before(() => {
    app = createApp();
    fs.writeFileSync(testFilePath, "Hello World");
  });

  after(() => {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  it("should allow uploading a valid file", async () => {
    const res = await request(app)
      .post("/api/uploads")
      .attach("file", testFilePath);
    
    expect(res.status).to.equal(201);
    expect(res.body.success).to.equal(true);
    expect(res.body.data.status).to.equal("uploaded");
  });

  it("should reject upload if no file is provided", async () => {
    const res = await request(app)
      .post("/api/uploads");
    
    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
    expect(res.body.message).to.equal("File is required");
  });
});
