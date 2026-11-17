export class RefreshTokenError extends Error {
  constructor(message: string = 'Invalid refresh token') {
    super(message);
    this.name = 'RefreshTokenError';
  }
}

export default { RefreshTokenError };