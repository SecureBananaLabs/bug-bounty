const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all search routes
router.use(authMiddleware);

router.get('/', searchController.search);

module.exports = router;