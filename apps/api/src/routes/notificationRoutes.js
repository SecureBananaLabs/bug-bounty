<content>
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes in this router
router.use(authMiddleware);

router.get('/', notificationController.getNotifications);
router.post('/', notificationController.createNotification);

module.exports = router;
</content>