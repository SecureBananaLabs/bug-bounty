import { Router } from "express";
import { getProposal, getProposals, postProposal } from "../controllers/proposalController.js";

export const proposalRoutes = Router();

proposalRoutes.get("/", getProposals);
proposalRoutes.get("/:id", getProposal);
proposalRoutes.post("/", postProposal);
