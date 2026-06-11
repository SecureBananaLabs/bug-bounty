const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const userController = require('../controllers/userController');

// Existing routes
// router.get('/', authenticate, userController.getUsers);
// router.get('/:id', authenticate, userController.getProfile);
// router.put('/:id', authenticate, userController.updateProfile);

// NEW: Route for the Settings page to provide actionable account controls
router.get('/settings', authenticate, userController.getSettings);

module.exports = router;