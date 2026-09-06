import { uploadFile } from "./uploadController.js";

describe("Upload File Requirement (#11641)", () => {
  it("should return 400 when req.file is missing", async () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await uploadFile(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
