<content>
const { v4: uuidv4 } = require('uuid');

/**
 * Creates a new proposal with a guaranteed unique ID.
 * @param {Object} payload - The proposal data.
 * @returns {Object} The created proposal with a unique ID.
 */
function createProposal(payload) {
  // Generate a unique ID by combining a timestamp with a UUIDv4 random part
  // This ensures uniqueness even if called multiple times in the same millisecond
  const uniqueId = `prp_${Date.now()}_${uuidv4()}`;

  return {
    id: uniqueId,
    ...payload,
    createdAt: new Date().toISOString(),
  };
}

module.exports = {
  createProposal,
};
</content>