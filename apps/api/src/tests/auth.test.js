import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { signAccessToken } from '../utils/jwt.js';

// Mock Date.now() to test race condition
describe('registerUser token subject matches returned id', () => {
  let originalDateNow;
  let callCount = 0;
  
  beforeEach(() => {
    callCount = 0;
    originalDateNow = Date.now;
    // Simulate Date.now() returning different values on consecutive calls
    Date.now = mock.fn(() => {
      callCount++;
      return 1000 + callCount; // Returns 1001, 1002, etc.
    });
  });
  
  it('should have matching id and token subject', async () => {
    // Import after mocking Date.now
    const { registerUser } = await import('../services/authService.js');
    
    const result = await registerUser({ email: 'test@example.com', role: 'client' });
    
    // Verify the id and token subject match
    assert.ok(result.id, 'Should return user id');
    assert.ok(result.token, 'Should return token');
    
    // Decode the JWT to verify the subject matches the returned id
    const decoded = JSON.parse(Buffer.from(result.token.split('.')[1], 'base64').toString());
    
    // The key assertion: token subject must equal returned user id
    assert.strictEqual(decoded.sub, result.id, 'Token subject must match returned user id');
    assert.strictEqual(decoded.role, 'client', 'Token role must match provided role');
  });
  
  it('should not have race condition between id and token subject', async () => {
    const { registerUser } = await import('../services/authService.js');
    
    // Even with Date.now() returning different values each call,
    // the id should still match the token subject
    const result = await registerUser({ email: 'test@example.com', role: 'client' });
    const decoded = JSON.parse(Buffer.from(result.token.split('.')[1], 'base64').toString());
    
    // This test would FAIL if Date.now() was called twice
    assert.strictEqual(decoded.sub, result.id);
  });
});
