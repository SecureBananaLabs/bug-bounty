const authService = require('../services/authService');
const { validationResult } = require('express-validator');

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, role } = req.body;

    // Prevent admin role self-assignment during registration
    if (role && role === 'admin') {
      return res.status(400).json({ error: 'Admin role cannot be self-assigned during registration' });
    }

    const allowedRoles = ['client', 'freelancer'];
    const userRole = role && allowedRoles.includes(role) ? role : 'client';

    const user = await authService.register({ email, password, name, role: userRole });
    res.status(201).json(user);
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
    const token = await authService.login(email, password);
    res.json({ token });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login };
