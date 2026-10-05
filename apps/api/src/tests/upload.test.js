const request = require('supertest');
const app = require('../app');
const sanitizeFilename = require('../utils/sanitizeFilename');

describe('File Upload', () => {
  describe('sanitizeFilename utility', () => {
    test('should remove path separators', () => {
      expect(sanitizeFilename('../../malicious.txt')).toBe('malicious.txt');
      expect(sanitizeFilename('folder\\subfolder\\file.txt')).toBe('file.txt');
      expect(sanitizeFilename('/var/www/html/file.txt')).toBe('file.txt');
    });

    test('should remove control characters', () => {
      expect(sanitizeFilename('file\x00name.txt')).toBe('filename.txt');
      expect(sanitizeFilename('file\x1Fname.txt')).toBe('filename.txt');
      expect(sanitizeFilename('file\x7Fname.txt')).toBe('filename.txt');
      expect(sanitizeFilename('file\nname.txt')).toBe('filename.txt');
      expect(sanitizeFilename('file\rname.txt')).toBe('filename.txt');
      expect(sanitizeFilename('file\tname.txt')).toBe('filename.txt');
    });

    test('should trim whitespace', () => {
      expect(sanitizeFilename('  filename.txt  ')).toBe('filename.txt');
      expect(sanitizeFilename('  file name.txt  ')).toBe('file name.txt');
    });

    test('should handle multiple dots correctly', () => {
      expect(sanitizeFilename('file..name.txt')).toBe('file.name.txt');
      expect(sanitizeFilename('...file.name.txt')).toBe('file.name.txt');
      expect(sanitizeFilename('file.name...txt')).toBe('file.name.txt');
      expect(sanitizeFilename('...file.name...txt')).toBe('file.name.txt');
    });

    test('should cap filename length', () => {
      const longName = 'a'.repeat(120) + '.txt';
      expect(sanitizeFilename(longName).length).toBe(100);
      expect(sanitizeFilename(longName).endsWith('.txt')).toBe(true);
      
      const longNameNoExt = 'a'.repeat(120);
      expect(sanitizeFilename(longNameNoExt).length).toBe(100);
    });

    test('should return default name for empty filenames', () => {
      expect(sanitizeFilename('')).toBe('unnamed_file');
      expect(sanitizeFilename(null)).toBe('unnamed_file');
      expect(sanitizeFilename(undefined)).toBe('unnamed_file');
      expect(sanitizeFilename('   ')).toBe('unnamed_file');
      expect(sanitizeFilename('\x00')).toBe('unnamed_file');
    });

    test('should preserve valid filenames', () => {
      expect(sanitizeFilename('valid-file-name.txt')).toBe('valid-file-name.txt');
      expect(sanitizeFilename('valid file name.txt')).toBe('valid file name.txt');
      expect(sanitizeFilename('file.name.with.dots.txt')).toBe('file.name.with.dots.txt');
    });
  });

  describe('upload endpoint', () => {
    test('should sanitize filename in response', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('file', __dirname + '/fixtures/sample.txt')
        .field('originalname', '../../../malicious.txt');

      expect(response.status).toBe(201);
      expect(response.body.data.filename).toBe('malicious.txt');
      expect(response.body.data.filename).not.toContain('../');
      expect(response.body.data.filename).not.toContain('\\');
    });

    test('should remove control characters from filename in response', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('file', __dirname + '/fixtures/sample.txt')
        .field('originalname', 'file\x00name.txt');

      expect(response.status).toBe(201);
      expect(response.body.data.filename).toBe('filename.txt');
      expect(response.body.data.filename).not.toContain('\x00');
    });

    test('should handle valid filenames', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('file', __dirname + '/fixtures/sample.txt')
        .field('originalname', 'valid-filename.txt');

      expect(response.status).toBe(201);
      expect(response.body.data.filename).toBe('valid-filename.txt');
    });
  });
});