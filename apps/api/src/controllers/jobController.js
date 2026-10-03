<content>
const { validationResult } = require('express-validator');
const Job = require('../models/Job');
const Category = require('../models/Category');
const { success, fail } = require('../utils/response');

const jobValidationSchema = require('../validators/jobValidator');

const postJob = async (req, res) => {
  try {
    // Validate the request body against the Zod schema
    const validatedData = jobValidationSchema.parse(req.body);

    // Check if category exists
    const categoryExists = await Category.findById(validatedData.categoryId);
    if (!categoryExists) {
      return fail(res, 400, 'Invalid category ID');
    }

    const newJob = new Job({
      ...validatedData,
      clientId: req.user.id,
    });

    await newJob.save();

    success(res, 201, 'Job created successfully', newJob);
  } catch (error) {
    if (error.name === 'ZodError') {
      // Map Zod errors to a more readable format
      const errorMessages = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return fail(res, 400, 'Validation failed', errorMessages);
    }
    // Handle other potential errors
    console.error(error);
    fail(res, 500, 'Internal server error');
  }
};

module.exports = {
  postJob,
};