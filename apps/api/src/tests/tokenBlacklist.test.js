const tokenBlacklistService = require('../services/tokenBlacklistService');
const redis = require('../config/redis');

jest.mock('../config/redis', () => ({
  set: jest.fn(),
  get: jest.fn(),
}));

describe('TokenBlacklistService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('revokeToken', () => {
    it('should store token in Redis with correct TTL when expiresAt is in future', async () => {
      const token = 'test-token-123';
      const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      
      await tokenBlacklistService.revokeToken(token, expiresAt);
      
      expect(redis.set).toHaveBeenCalledWith(
        'token:blacklist:test-token-123',
        'revoked',
        'EX',
        3600
      );
    });

    it('should not store token when expiresAt is in past', async () => {
      const token = 'expired-token';
      const expiresAt = Math.floor(Date.now() / 1000) - 100; // 100 seconds ago
      
      await tokenBlacklistService.revokeToken(token, expiresAt);
      
      expect(redis.set).not.toHaveBeenCalled();
    });

    it('should not store token when expiresAt is now', async () => {
      const token = 'expired-token-now';
      const expiresAt = Math.floor(Date.now() / 1000); // now
      
      await tokenBlacklistService.revokeToken(token, expiresAt);
      
      expect(redis.set).not.toHaveBeenCalled();
    });
  });

  describe('isTokenRevoked', () => {
    it('should return true when token exists in blacklist', async () => {
      const token = 'revoked-token';
      redis.get.mockResolvedValue('revoked');
      
      const result = await tokenBlacklistService.isTokenRevoked(token);
      
      expect(result).toBe(true);
      expect(redis.get).toHaveBeenCalledWith('token:blacklist:revoked-token');
    });

    it('should return false when token does not exist in blacklist', async () => {
      const token = 'valid-token';
      redis.get.mockResolvedValue(null);
      
      const result = await tokenBlacklistService.isTokenRevoked(token);
      
      expect(result).toBe(false);
      expect(redis.get).toHaveBeenCalledWith('token:blacklist:valid-token');
    });

    it('should return false when token exists but value is not revoked', async () => {
      const token = 'weird-token';
      redis.get.mockResolvedValue('something-else');
      
      const result = await tokenBlacklistService.isTokenRevoked(token);
      
      expect(result).toBe(false);
    });
  });
});
