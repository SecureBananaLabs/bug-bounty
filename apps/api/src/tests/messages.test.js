/**
 * @file messages.test.js
 * Unit tests for message validation schema and messageController handling.
 */

import assert from 'assert';
import {
  createMessageSchema,
  validateCreateMessage,
} from '../validators/message.js';
import { postMessage } from '../controllers/messageController.js';

async function runTests() {
  console.log('Running message validation unit tests...');

  // Test 1: Valid message payload accepted (201 Created)
  {
    const payload = {
      recipientId: 'usr_dev456',
      content: 'Hello! I reviewed your pull request and merged the changes.',
      conversationId: 'conv_789',
    };

    const res = validateCreateMessage(payload);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.data.recipientId, 'usr_dev456');
    assert.strictEqual(res.data.content, payload.content);

    let statusCalled = 0;
    let jsonResult = null;
    const mockRes = {
      status: (code) => {
        statusCalled = code;
        return {
          json: (data) => {
            jsonResult = data;
            return data;
          },
        };
      },
    };

    await postMessage({ body: payload }, mockRes);
    assert.strictEqual(statusCalled, 201);
    assert.strictEqual(jsonResult.success, true);
    console.log('✔ Test 1 passed: Valid message payload accepted with HTTP 201');
  }

  // Test 2: Missing recipientId rejected (400 Bad Request)
  {
    const payload = {
      content: 'Hello world',
    };

    const res = validateCreateMessage(payload);
    assert.strictEqual(res.valid, false);
    assert.ok(res.error.includes('recipientId'));

    let statusCalled = 0;
    let jsonResult = null;
    const mockRes = {
      status: (code) => {
        statusCalled = code;
        return {
          json: (data) => {
            jsonResult = data;
            return data;
          },
        };
      },
    };

    await postMessage({ body: payload }, mockRes);
    assert.strictEqual(statusCalled, 400);
    assert.strictEqual(jsonResult.success, false);
    console.log('✔ Test 2 passed: Missing recipientId rejected with HTTP 400');
  }

  // Test 3: Empty or whitespace content rejected (400 Bad Request)
  {
    const payload = {
      recipientId: 'usr_dev456',
      content: '',
    };

    const res = validateCreateMessage(payload);
    assert.strictEqual(res.valid, false);
    assert.ok(res.error.includes('content'));

    let statusCalled = 0;
    const mockRes = {
      status: (code) => {
        statusCalled = code;
        return {
          json: (data) => data,
        };
      },
    };

    await postMessage({ body: payload }, mockRes);
    assert.strictEqual(statusCalled, 400);
    console.log('✔ Test 3 passed: Empty content rejected with HTTP 400');
  }

  // Test 4: Oversized content (> 5000 chars) rejected
  {
    const payload = {
      recipientId: 'usr_dev456',
      content: 'a'.repeat(5001),
    };

    const res = validateCreateMessage(payload);
    assert.strictEqual(res.valid, false);
    assert.ok(res.error.includes('5000 characters'));
    console.log('✔ Test 4 passed: Oversized content rejected');
  }

  console.log('All message validation tests passed successfully!');
}

runTests();
