<content>
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// Validation middleware for register
const registerValidation = [
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

// Validation middleware for login
const loginValidation = [
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Wrap route handlers to catch validation errors and return 400
const handleValidation = (handler) => async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Invalid request payload',
      details: errors.array(),
    });
  }
  await handler(req, res, next);
};

// Register endpoint
router.post('/register', registerValidation, handleValidation(async (req, res) => {
  const { email, password } = req.body;
  
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      error: 'Registration failed',
      details: 'User with this email already exists',
    });
  }

  // Create new user (password hashing should happen in the User model)
  const user = new User({ email, password });
  await user.save();

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: user._id,
      email: user.email,
    },
  });
}));

// Login endpoint
router.post('/login', loginValidation, handleValidation(async (req, res) => {
  const { email, password } = req.body;
  
  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({
      error: 'Authentication failed',
      details: 'Invalid email or password',
    });
  }

  // Check password (this should use a secure comparison method)
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      error: 'Authentication failed',
      details: 'Invalid email or password',
    });
  }

  res.json({
    message: 'Login successful',
    user: {
      id: user._id,
      email: user.email,
    },
  });
}));

module.exports = router;
</content>