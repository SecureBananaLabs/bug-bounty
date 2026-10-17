const express = require('express');
const BugDetectionController = require('../controllers/bugDetectionController');

const router = express.Router();
const bugDetectionController = new BugDetectionController();

router.get('/scan', bugDetectionController.scanForBugs.bind(bugDetectionController));
router.post('/generate-issue', bugDetectionController.generateBugIssue.bind(bugDetectionController));

module.exports = router;