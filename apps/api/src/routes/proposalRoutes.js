import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getProposals, postProposal } from "../controllers/proposalController.js";

proposalRoutes.use(authMiddleware);

export const proposalRoutes = Router();

proposalRoutes.get("/", getProposals);
proposalRoutes.post("/", postProposal);
