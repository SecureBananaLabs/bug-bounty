const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ProposalService {
  async createProposal(data) {
    // Ignore any caller-supplied createdAt; always use server-generated timestamp
    const { createdAt, ...cleanData } = data;
    
    const proposal = await prisma.proposal.create({
      data: {
        ...cleanData,
        createdAt: new Date().toISOString(),
      },
    });
    return proposal;
  }

  async getProposalById(id) {
    return prisma.proposal.findUnique({ where: { id } });
  }

  async updateProposal(id, data) {
    // For updates, we also ignore createdAt if provided
    const { createdAt, ...cleanData } = data;
    return prisma.proposal.update({
      where: { id },
      data: cleanData,
    });
  }

  async deleteProposal(id) {
    return prisma.proposal.delete({ where: { id } });
  }

  async listProposals(filters = {}) {
    return prisma.proposal.findMany({ where: filters });
  }
}

module.exports = new ProposalService();