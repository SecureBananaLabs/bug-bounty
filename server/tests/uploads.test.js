const request = require('supertest');
const express = require('express');
const uploadsRouter = require('../routes/uploads');
const fs = require('fs');
const path = require('path');

const app = express();
app.use('/api/uploads', uploadsRouter);

// Ensure the uploads directory exists for tests
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

describe('POST /api/uploads', () => {
  afterEach(() => {
    // Clean up any uploaded files after each test
    fs.readdir(uploadDir, (err, files) => {
      if (err) throw err;
      for (const file of files) {
        fs.unlink(path.join(uploadDir, file), (err) => {
          if (err) throw err;
        });
      }
    });
  });

  it('should return 201 and success: true for a valid file upload', (done) => {
    request(app)
      .post('/api/uploads')
      .attach('file', Buffer.from('test content'), 'test.txt')
      .expect(201)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property('status', 'uploaded');
        expect(res.body).to.have.property('filename');
        done();
      });
  });

  it('should return 400 Bad Request when no file is uploaded', (done) => {
    request(app)
      .post('/api/uploads')
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('message', 'No file uploaded');
        done();
      });
  });
});
