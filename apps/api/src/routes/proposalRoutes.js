import { Router } from "express";
import { getProposals, postProposal } from "../controllers/proposalController.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const proposalRoutes = Router();

proposalRoutes.get("/", asyncHandler(getProposals));
proposalRoutes.post("/", asyncHandler(postProposal));
