const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const authService = require('../services/authService');
const { createError } = require('../middleware/errorHandler');

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, fullName, role } = req.body;

    if (!fullName || fullName.trim().length === 0) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const user = await authService.registerUser({ email, password, fullName: fullName.trim(), role });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);

    res.json({
      message: 'Login successful',
      token: result.token,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        role: result.user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login };
