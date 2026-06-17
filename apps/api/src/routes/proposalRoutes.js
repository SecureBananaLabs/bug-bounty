import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { createProposal, getProposals, getProposalById, updateProposal, deleteProposal } from '../controllers/proposalController.js';
import { validate } from '../middleware/validate.js';
import { createProposalSchema } from '../validators/proposalValidator.js';

const router = Router();

router.post('/', protect, validate(createProposalSchema), createProposal);
router.get('/', protect, getProposals);
router.get('/:id', protect, getProposalById);
router.put('/:id', protect, updateProposal);
router.delete('/:id', protect, deleteProposal);

export { router as proposalRoutes };
