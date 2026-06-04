const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    // req.body is already validated and parsed by middleware
    const user = await authService.register(req.body);
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const token = await authService.login(req.body);
    res.json({ message: 'Login successful', token });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
