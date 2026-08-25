import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getProposals, postProposal } from "../controllers/proposalController.js";

export const proposalRoutes = Router();

proposalRoutes.use(authMiddleware);
proposalRoutes.get("/", getProposals);
proposalRoutes.post("/", postProposal);
