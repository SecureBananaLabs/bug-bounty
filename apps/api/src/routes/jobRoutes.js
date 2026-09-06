const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { validate } = require('../middleware/validate');
const { createJobSchema } = require('../validators/jobValidators');

router.post('/', validate(createJobSchema), jobController.createJob);
router.get('/', jobController.getJobs);
router.get('/:id', jobController.getJobById);
router.put('/:id', jobController.updateJob);
router.delete('/:id', jobController.deleteJob);

module.exports = router;
