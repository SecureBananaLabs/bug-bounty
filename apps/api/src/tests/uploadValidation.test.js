import { handleFileUploadRequest } from '../controllers/uploadFileValidation';

describe('File Upload Controller Validation', () => {
  it('should return HTTP 400 when file is missing', () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    handleFileUploadRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "File is required"
    });
  });

  it('should return HTTP 201 when valid file is provided', () => {
    const req = { file: { filename: 'test.png' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    handleFileUploadRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      status: "uploaded",
      filename: "test.png"
    });
  });
});
