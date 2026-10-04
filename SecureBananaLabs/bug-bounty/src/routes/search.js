<content>
const express = require('express');
const router = express.Router();
const { User, Job } = require('../models');

// Global search endpoint
router.get('/', async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    // Search for users matching the query in email, name, or skills
    const userMatches = await User.find({
      $or: [
        { email: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { skills: { $regex: q, $options: 'i' } }
      ]
    }).limit(10);

    // Search for jobs matching the query in title, description, or skill names
    const jobMatches = await Job.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { requiredSkills: { $regex: q, $options: 'i' } }
      ]
    }).limit(10);

    res.json({
      users: userMatches,
      jobs: jobMatches
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;