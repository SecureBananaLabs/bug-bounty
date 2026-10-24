import { Router } from "express";
import { getProposals, postProposal, getProposal } from "../controllers/proposalController.js";

export const proposalRoutes = Router();

proposalRoutes.get("/", getProposals);
proposalRoutes.post("/", postProposal);
proposalRoutes.get("/:id", getProposal);
