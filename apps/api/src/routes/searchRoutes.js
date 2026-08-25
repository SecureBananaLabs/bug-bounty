const express = require('express');
const { search } = require('../controllers/searchController');
const { validateSearchQuery } = require('../validators/search');

const router = express.Router();

router.get('/', validateSearchQuery, search);

module.exports = router;
