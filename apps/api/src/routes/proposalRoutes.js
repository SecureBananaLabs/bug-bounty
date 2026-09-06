const express = require('express');
const router = express.Router();
const proposalController = require('../controllers/proposalController');

// POST /api/proposals - Create a new proposal
router.post('/', proposalController.createProposal);

// GET /api/proposals/job/:jobId - Get proposals for a job
router.get('/job/:jobId', proposalController.getProposalsByJob);

// GET /api/proposals/freelancer/:freelancerId - Get proposals by freelancer
router.get('/freelancer/:freelancerId', proposalController.getProposalsByFreelancer);

// GET /api/proposals/:id - Get a single proposal
router.get('/:id', proposalController.getProposalById);

// PUT /api/proposals/:id - Update a proposal
router.put('/:id', proposalController.updateProposal);

// DELETE /api/proposals/:id - Delete a proposal
router.delete('/:id', proposalController.deleteProposal);

module.exports = router;
