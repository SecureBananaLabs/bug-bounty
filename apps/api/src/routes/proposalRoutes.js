import { Router } from "express";
import { getProposals, postProposal } from "../controllers/proposalController.js";
import { authMiddleware } from "../middleware/auth.js";

export const proposalRoutes = Router();

proposalRoutes.use(authMiddleware);
proposalRoutes.get("/", getProposals);
proposalRoutes.post("/", postProposal);
