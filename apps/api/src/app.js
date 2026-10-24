import express from "express";
import {
  createProposal,
  getProposals,
  getProposalById,
  updateProposal,
  deleteProposal,
} from "../controllers/proposalController.js";
import { protect } from "../middleware/auth.js";

/**
 * Middleware to validate proposal creation payload.
 * Ensures that `estimatedDuration` is present and is a positive number.
 */
const validateProposal = (req, res, next) => {
  const { estimatedDuration } = req.body;

  // Check presence
  if (estimatedDuration === undefined || estimatedDuration === null) {
    return res.status(400).json({
      message: "Estimated duration is required",
    });
  }

  // Check type and value
  if (typeof estimatedDuration !== "number" || estimatedDuration <= 0) {
    return res.status(400).json({
      message: "Estimated duration must be a positive number",
    });
  }

  next();
};

const router = express.Router();

router.post("/", protect, validateProposal, createProposal);
router.get("/", protect, getProposals);
router.get("/:id", protect, getProposalById);
router.put("/:id", protect, updateProposal);
router.delete("/:id", protect, deleteProposal);

export { router as proposalRoutes };
