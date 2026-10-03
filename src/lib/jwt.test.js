<content>
import { signAccessToken, verifyAccessToken } from './jwt.js';

describe('JWT Utilities', () => {
  const testSecret = 'a-very-secret-key';
  const validPayload = { sub: '1234567890', name: 'Test User' };

  describe('signAccessToken', () => {
    it('should sign a token with the HS256 algorithm', () => {
      const token = signAccessToken(validPayload, testSecret);
      const decodedHeader = jwt.decode(token, { complete: true }).header;

      expect(decodedHeader.alg).toBe('HS256');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid HS256 token', () => {
      const token = signAccessToken(validPayload, testSecret);
      const decodedPayload = verifyAccessToken(token, testSecret);

      expect(decodedPayload).toEqual(validPayload);
    });

    it('should reject an HS512 token signed with the same secret', () => {
      const hs512Token = jwt.sign(validPayload, testSecret, { algorithm: 'HS512' });

      expect(() => {
        verifyAccessToken(hs512Token, testSecret);
      }).toThrow(jwt.JsonWebTokenError);
    });

    it('should reject a token with an invalid signature', () => {
      const token = signAccessToken(validPayload, testSecret);
      const tamperedToken = token.split('.').slice(0, 2).join('.') + '.tampered';

      expect(() => {
        verifyAccessToken(tamperedToken, testSecret);
      }).toThrow(jwt.JsonWebTokenError);
    });
  });
});
</content>