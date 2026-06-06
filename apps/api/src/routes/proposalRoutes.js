import { Router } from "express";
import { getProposals, postProposal } from "../controllers/proposalController.js";
import { methodNotAllowed } from "../middleware/methodNotAllowed.js";

export const proposalRoutes = Router();

proposalRoutes.get("/", getProposals);
proposalRoutes.post("/", postProposal);
proposalRoutes.all("/", methodNotAllowed(["GET", "POST"]));
