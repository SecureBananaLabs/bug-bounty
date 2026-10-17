const express = require('express');
const router = express.Router();
const { detectAndCreateIssues } = require('../services/bugDetection');

router.post('/detect', async (req, res) => {
  detectAndCreateIssues()
    .then(() => res.json({ message: 'Bug scan initiated' }))
    .catch(err => res.status(500).json({ error: err.message }));
});

module.exports = router;
