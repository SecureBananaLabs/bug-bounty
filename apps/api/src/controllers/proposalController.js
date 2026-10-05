import { proposalService } from '../services/proposalService.js';
import { createProposalSchema } from '../validators/proposal.js';
import { response } from '../utils/response.js';

export const proposalController = {
  async postProposal(req, res) {
    try {
      // Validate request payload
      const validatedData = createProposalSchema.parse(req.body);
      
      const proposal = await proposalService.createProposal(validatedData);
      return response.success(res, 201, 'Proposal created successfully', proposal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return response.error(res, 400, 'Validation error', error.errors);
      }
      console.error('Error creating proposal:', error);
      return response.error(res, 500, 'Internal server error');
    }
  },

  async getProposals(req, res) {
    try {
      const { jobId } = req.query;
      const proposals = await proposalService.getProposals(jobId);
      return response.success(res, 200, 'Proposals retrieved successfully', proposals);
    } catch (error) {
      console.error('Error retrieving proposals:', error);
      return response.error(res, 500, 'Internal server error');
    }
  },

  async getProposalById(req, res) {
    try {
      const { id } = req.params;
      const proposal = await proposalService.getProposalById(id);
      if (!proposal) {
        return response.error(res, 404, 'Proposal not found');
      }
      return response.success(res, 200, 'Proposal retrieved successfully', proposal);
    } catch (error) {
      console.error('Error retrieving proposal:', error);
      return response.error(res, 500, 'Internal server error');
    }
  },

  async updateProposal(req, res) {
    try {
      const { id } = req.params;
      const validatedData = updateProposalSchema.parse(req.body);
      
      const proposal = await proposalService.updateProposal(id, validatedData);
      if (!proposal) {
        return response.error(res, 404, 'Proposal not found');
      }
      return response.success(res, 200, 'Proposal updated successfully', proposal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return response.error(res, 400, 'Validation error', error.errors);
      }
      console.error('Error updating proposal:', error);
      return response.error(res, 500, 'Internal server error');
    }
  },

  async deleteProposal(req, res) {
    try {
      const { id } = req.params;
      const proposal = await proposalService.deleteProposal(id);
      if (!proposal) {
        return response.error(res, 404, 'Proposal not found');
      }
      return response.success(res, 200, 'Proposal deleted successfully');
    } catch (error) {
      console.error('Error deleting proposal:', error);
      return response.error(res, 500, 'Internal server error');
    }
  },
};