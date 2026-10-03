<content>
const { v4: uuidv4 } = require('uuid');

/**
 * Creates a new job with a unique identifier.
 * @param {Object} payload - The job payload data.
 * @returns {Object} The newly created job object with a unique ID.
 */
function createJob(payload) {
  // Generate a unique ID using UUIDv4 to ensure uniqueness even within the same millisecond.
  // The prefix 'job_' is kept to maintain the existing contract.
  const id = `job_${uuidv4()}`;

  return {
    id,
    ...payload,
    createdAt: new Date().toISOString(),
  };
}

module.exports = {
  createJob,
};
</content>