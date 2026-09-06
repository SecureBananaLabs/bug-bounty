import { validateSchema } from "../middleware/validationMiddleware.js";
import { ProposalSchema } from "../schemas/validationSchemas.js";
import { Router } from "express";
import { getProposals, postProposal } from "../controllers/proposalController.js";

export const proposalRoutes = Router();

proposalRoutes.get("/", getProposals);
proposalRoutes.post("/", postProposal);
