const express = require('express');
const router = express.Router();
const proposalController = require('../controllers/proposalController');

// Create a proposal
router.post('/', proposalController.createProposal);

// Get all proposals
router.get('/', proposalController.getAllProposals);

// Get proposals by job ID
router.get('/job/:jobId', proposalController.getProposalsByJob);

// Get proposals by freelancer ID
router.get('/freelancer/:freelancerId', proposalController.getProposalsByFreelancer);

// Get a single proposal by ID
router.get('/:id', proposalController.getProposalById);

// Update a proposal
router.put('/:id', proposalController.updateProposal);

// Delete a proposal
router.delete('/:id', proposalController.deleteProposal);

module.exports = router;
