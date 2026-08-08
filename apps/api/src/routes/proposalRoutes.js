import { Router } from "express";
import { getProposals, postProposal } from "../controllers/proposalController.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const proposalRoutes = Router();

proposalRoutes.get("/", getProposals);
proposalRoutes.post("/", postProposal);
