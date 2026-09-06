const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticate } = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/', jobController.listJobs);
router.get('/:id', jobController.getJob);

// Protected routes (authentication required)
router.post('/', authenticate, jobController.createJob);
router.put('/:id', authenticate, jobController.updateJob);
router.delete('/:id', authenticate, jobController.deleteJob);

module.exports = router;
