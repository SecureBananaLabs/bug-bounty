import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { tokenBlacklist } from '../services/tokenBlacklistService.js';

describe('Token Blacklist & Revocation Service', () => {
  beforeEach(() => {
    tokenBlacklist.clear();
  });

  it('reports active non-revoked token as false', () => {
    assert.equal(tokenBlacklist.isTokenRevoked('valid_jwt_token_123'), false);
  });

  it('revokes a token and verifies it is recognized as revoked', () => {
    const token = 'jwt_sample_token_abc';
    tokenBlacklist.revokeToken(token, Date.now() + 60000);
    assert.equal(tokenBlacklist.isTokenRevoked(token), true);
  });

  it('automatically un-blacklists tokens that have naturally passed their expiry', () => {
    const token = 'jwt_expired_token_xyz';
    // Expired 10 seconds ago
    tokenBlacklist.revokeToken(token, Date.now() - 10000);
    assert.equal(tokenBlacklist.isTokenRevoked(token), false);
  });

  it('handles invalid inputs gracefully without throwing', () => {
    assert.equal(tokenBlacklist.isTokenRevoked(null), false);
    assert.equal(tokenBlacklist.isTokenRevoked(''), false);
    tokenBlacklist.revokeToken(null);
  });
});
