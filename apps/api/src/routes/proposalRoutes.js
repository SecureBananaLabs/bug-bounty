import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getProposals, postProposal } from "../controllers/proposalController.js";

export const proposalRoutes = Router();

proposalRoutes.get("/", getProposals);
proposalRoutes.post("/", authMiddleware, postProposal);
