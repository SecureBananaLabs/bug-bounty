import { Router } from "express";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { createProposal, getProposals, approveProposal } from "../controllers/proposalController.js";

export const proposalRoutes = Router();

proposalRoutes.use(authMiddleware);
proposalRoutes.post("/", requireRole("freelancer"), createProposal);
proposalRoutes.get("/", getProposals);
proposalRoutes.post("/:id/approve", requireRole("client"), approveProposal);
