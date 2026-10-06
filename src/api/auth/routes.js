const express = require('express');
const authController = require('./index');
const router = express.Router();

router.post('/refresh', authController.refresh);

module.exports = router;