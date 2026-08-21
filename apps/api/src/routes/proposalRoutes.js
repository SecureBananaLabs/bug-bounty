import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getProposals, postProposal } from "../controllers/proposalController.js";

export const proposalRoutes = Router();

proposalRoutes.get("/", authMiddleware, getProposals);
proposalRoutes.post("/", authMiddleware, postProposal);
