import { Router } from "express";
import { getProposals, postProposal } from "../controllers/proposalController.js";
import { authMiddleware } from "../middleware/auth.js";

export const proposalRoutes = Router();

// Proposals are written on behalf of one account, so both handlers need the
// verified bearer identity instead of answering every anonymous caller.
proposalRoutes.use(authMiddleware);
proposalRoutes.get("/", getProposals);
proposalRoutes.post("/", postProposal);
