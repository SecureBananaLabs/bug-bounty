<content>
const express = require("express");
const proposalController = require("../controllers/proposalController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes - no authentication required
router.get("/", proposalController.getAllProposals);

// Protected routes - authentication required
router.post("/", authMiddleware, proposalController.postProposal);

module.exports = router;