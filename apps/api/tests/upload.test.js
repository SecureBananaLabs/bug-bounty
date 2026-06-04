const request = require('supertest');
const app = require('../src/app');
const path = require('path');
const fs = require('fs');

// Helper to create a temporary test file
function createTempFile(content = 'test file content') {
  const filePath = path.join(__dirname, 'temp_test_file.txt');
  fs.writeFileSync(filePath, content);
  return filePath;
}

function cleanupTempFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

describe('POST /api/uploads', () => {
  afterEach(() => {
    const tempFile = path.join(__dirname, 'temp_test_file.txt');
    cleanupTempFile(tempFile);
  });

  it('should return 400 when no file is provided', async () => {
    const res = await request(app)
      .post('/api/uploads')
      .send({})
      .expect('Content-Type', /json/)
      .expect(400);

    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('status', 'no-file');
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toContain('No file provided');
  });

  it('should return 400 when file field is missing (empty multipart)', async () => {
    const res = await request(app)
      .post('/api/uploads')
      .field('name', 'test') // no file field
      .expect('Content-Type', /json/)
      .expect(400);

    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('status', 'no-file');
  });

  it('should return 201 when a file is provided', async () => {
    const testFilePath = createTempFile('hello world');

    const res = await request(app)
      .post('/api/uploads')
      .attach('file', testFilePath)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('status', 'uploaded');
    expect(res.body).toHaveProperty('file');
    expect(res.body.file).toHaveProperty('filename');
    expect(res.body.file).toHaveProperty('originalname', 'temp_test_file.txt');
    expect(res.body.file).toHaveProperty('size');
    expect(res.body.file).toHaveProperty('mimetype');

    // Clean up uploaded file
    const uploadedPath = path.join(__dirname, '../uploads', res.body.file.filename);
    cleanupTempFile(uploadedPath);
  });

  it('should return 201 for different file types', async () => {
    const testFilePath = path.join(__dirname, 'temp_test_image.png');
    fs.writeFileSync(testFilePath, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])); // minimal PNG header

    const res = await request(app)
      .post('/api/uploads')
      .attach('file', testFilePath)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.file.mimetype).toMatch(/image\/png|application\/octet-stream/);

    // Clean up
    cleanupTempFile(testFilePath);
    const uploadedPath = path.join(__dirname, '../uploads', res.body.file.filename);
    cleanupTempFile(uploadedPath);
  });
});
