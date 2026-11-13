import assert from 'assert';
import { uploadFile } from '../controllers/uploadController.js';

async function runTests() {
  console.log('Running upload validation unit tests...');

  // Test 1: Missing file returns 400
  {
    let statusCalled = 0;
    let jsonResult = null;
    const mockRes = {
      status: (code) => { statusCalled = code; return { json: (d) => { jsonResult = d; return d; } }; },
    };
    await uploadFile({ file: undefined }, mockRes);
    assert.strictEqual(statusCalled, 400);
    assert.strictEqual(jsonResult.success, false);
    assert.ok(jsonResult.message.includes('File is required'));
    console.log('✔ Test 1 passed: Missing file rejected with 400');
  }

  // Test 2: Valid file returns 201 with metadata
  {
    let statusCalled = 0;
    let jsonResult = null;
    const mockRes = {
      status: (code) => { statusCalled = code; return { json: (d) => { jsonResult = d; return d; } }; },
    };
    await uploadFile({ file: { originalname: 'resume.pdf', size: 102400, mimetype: 'application/pdf' } }, mockRes);
    assert.strictEqual(statusCalled, 201);
    assert.strictEqual(jsonResult.success, true);
    assert.strictEqual(jsonResult.data.filename, 'resume.pdf');
    assert.strictEqual(jsonResult.data.size, 102400);
    assert.strictEqual(jsonResult.data.mimetype, 'application/pdf');
    assert.strictEqual(jsonResult.data.status, 'uploaded');
    console.log('✔ Test 2 passed: Valid file accepted with 201 and metadata');
  }

  // Test 3: Null file returns 400
  {
    let statusCalled = 0;
    const mockRes = {
      status: (code) => { statusCalled = code; return { json: (d) => d }; },
    };
    await uploadFile({ file: null }, mockRes);
    assert.strictEqual(statusCalled, 400);
    console.log('✔ Test 3 passed: Null file rejected with 400');
  }

  console.log('All upload tests passed successfully!');
}

runTests();
