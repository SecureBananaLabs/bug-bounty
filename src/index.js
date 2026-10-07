const express = require('express');
const { createJobValidator, updateJobValidator } = require('./validators/job');
const { validateBudgetRange } = require('./utils/budget');

const app = express();
app.use(express.json());

// In-memory store for jobs
let jobs = {};
let jobIdCounter = 1;

app.post('/api/jobs', createJobValidator, (req, res) => {
  const id = jobIdCounter++;
  const job = { id, ...req.body };
  jobs[id] = job;
  res.status(201).json({ success: true, data: job });
});

app.patch('/api/jobs/:id', updateJobValidator, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!jobs[id]) {
    return res.status(404).json({ success: false, error: 'Job not found' });
  }
  jobs[id] = { ...jobs[id], ...req.body };
  res.json({ success: true, data: jobs[id] });
});

app.get('/api/jobs', (_req, res) => {
  res.json({ success: true, data: Object.values(jobs) });
});

app.get('/api/jobs/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const job = jobs[id];
  if (!job) {
    return res.status(404).json({ success: false, error: 'Job not found' });
  }
  res.json({ success: true, data: job });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
