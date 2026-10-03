<content>
const express = require('express');
const { loginUser } = require('../services/authService');
const router = express.Router();

/**
 * POST /api/auth/login
 * Authenticates user credentials and returns a JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const token = await loginUser(email, password);
    res.json({ token });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

module.exports = router;
</content>