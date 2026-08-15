import { Router } from "express";
import { getProposals, postProposal } from "../controllers/proposalController.js";
import { validate } from "../middleware/validate.js";
import { createProposalSchema } from "../validators/proposal.js";

export const proposalRoutes = Router();

proposalRoutes.get("/", getProposals);
proposalRoutes.post("/", validate(createProposalSchema), postProposal);
