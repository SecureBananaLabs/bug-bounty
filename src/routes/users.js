<content>
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// In-memory user store (as mentioned in the issue)
let users = [];

// POST /api/users - Create a new user
router.post('/', [
  // Validation middleware
  body('email').isEmail().withMessage('Email must be a valid email address'),
  body('role').isIn(['freelancer', 'client']).withMessage('Role must be either freelancer or client')
], (req, res) => {
  // Check if validation failed
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Create user if validation passes
  const newUser = {
    id: users.length + 1,
    email: req.body.email,
    role: req.body.role,
    // Add any other required fields here
  };

  users.push(newUser);
  res.status(201).json(newUser);
});

module.exports = router;
</content>