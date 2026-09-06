const authService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const result = await authService.register(value);
    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const result = await authService.login(value);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { token } = req.body;           // FIX: extract token from body
    if (!token) {
      return res.status(400).json({ message: 'Refresh token is required.' });
    }

    const result = await authService.refreshToken(token);  // FIX: pass token
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refresh };
