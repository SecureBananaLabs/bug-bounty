import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const JWT_SECRET = env.jwtSecret || 'fallback-secret';

export const authService = {
  async register({ email, password, role }) {
    // 注册逻辑...
    const user = { id: 'generated-id', email, role };
    const token = this._signToken(user.id, user.role);
    return { user, token };
  },

  async login({ email, password }) {
    // 登录逻辑...
    const user = { id: 'found-id', email, role: 'client' };
    const token = this._signToken(user.id, user.role);
    return { user, token };
  },

  async refreshToken(subject, role) {
    // 刷新 token，使用传入的 subject 和 role 代替硬编码
    return this._signToken(subject, role);
  },

  async handleOAuthCallback(code) {
    // OAuth 处理...
    const user = { id: 'oauth-id', email: 'oauth@example.com', role: 'freelancer' };
    const token = this._signToken(user.id, user.role);
    return { user, token };
  },

  _signToken(subject, role) {
    return jwt.sign(
      { sub: subject, role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  }
};
