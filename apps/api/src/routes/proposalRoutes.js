import { Router } from "express";
import { getProposals, postProposal } from "../controllers/proposalController.js";
import { authMiddleware } from "../middleware/auth.js";

export const proposalRoutes = Router();

proposalRoutes.get("/", authMiddleware, getProposals);
proposalRoutes.post("/", postProposal);
