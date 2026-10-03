<content>
import jwt from 'jsonwebtoken';

/**
 * Signs an access token with HS256 algorithm.
 * @param {object} payload - The payload to include in the token.
 * @param {string} secret - The secret key to sign the token with.
 * @returns {string} The signed JWT.
 */
export function signAccessToken(payload, secret) {
  return jwt.sign(payload, secret, { algorithm: 'HS256' });
}

/**
 * Verifies an access token, ensuring it was signed with the HS256 algorithm.
 * @param {string} token - The token to verify.
 * @param {string} secret - The secret key to verify the token with.
 * @returns {object} The decoded payload.
 * @throws {jwt.JsonWebTokenError} If the token is invalid or not signed with HS256.
 */
export function verifyAccessToken(token, secret) {
  return jwt.verify(token, secret, { algorithms: ['HS256'] });
}
</content>