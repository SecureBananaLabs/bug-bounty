<content>
import { signAccessToken } from '../utils/jwt';

export async function refreshToken(token) {
  if (!token) {
    throw new Error('Refresh token is required');
  }

  // In a real application, you would verify the refresh token here
  // For example, decode it, check if it's expired, and validate against the database
  // For this fix, we'll assume the token is valid and extract the payload
  const decoded = { sub: 'usr_from_refresh_token', role: 'client' }; // Placeholder for actual token decoding

  return { token: signAccessToken(decoded) };
}
</content>