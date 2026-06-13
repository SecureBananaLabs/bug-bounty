// Assuming the jobController.js has a function to create or update a job
const createJob = async (req, res) => {
  try {
    const { minBudget, maxBudget } = req.body;
    // Validate budget range
    if (minBudget > maxBudget) {
      return res.status(400).json({ error: 'Invalid budget range' });
    }
    // Proceed with job creation or update
    // ...
  } catch (error) {
    // Handle error
  }
};

// Exporting the controller function
export { createJob };