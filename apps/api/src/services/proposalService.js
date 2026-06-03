const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class ProposalService {
  async createProposal(payload) {
    // Generate server-owned id, ignoring any client-supplied 'id'
    const id = `prp_${Date.now()}`;
    const { id: _unused, ...safePayload } = payload;
    const proposal = { id, ...safePayload };
    const result = await db.collection('proposals').insertOne(proposal);
    return { id: result.insertedId, ...proposal };
  }

  async getProposal(id) {
    return db.collection('proposals').findOne({ id });
  }

  async updateProposal(id, updates) {
    return db.collection('proposals').findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: 'after' }
    );
  }

  async deleteProposal(id) {
    return db.collection('proposals').deleteOne({ id });
  }

  async listProposals(filter = {}) {
    return db.collection('proposals').find(filter).toArray();
  }
}

module.exports = new ProposalService();