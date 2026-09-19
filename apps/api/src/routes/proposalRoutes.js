import { Router } from "express";
import { getProposals, postProposal } from "../controllers/proposalController.js";
import { authMiddleware } from "../middleware/auth.js";

export const proposalRoutes = Router();

proposalRoutes.get("/", getProposals);
// Security fix (issue #2773): proposal creation must be authenticated.
proposalRoutes.post("/", authMiddleware, postProposal);
