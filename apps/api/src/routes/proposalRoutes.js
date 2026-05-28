import { Router } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { getProposals, postProposal } from "../controllers/proposalController.js";

export const proposalRoutes = Router();

proposalRoutes.get("/", catchAsync(getProposals));
proposalRoutes.post("/", catchAsync(postProposal));
