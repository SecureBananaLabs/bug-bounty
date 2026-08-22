import { Router } from "express";
import { getProposals, postProposal } from "../controllers/proposalController.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";

const schema = z.object({ jobId: z.string().min(1), coverLetter: z.string().min(10), bidAmount: z.number().positive(), estimatedDuration: z.string().min(1) }).strict();

export const proposalRoutes = Router();

proposalRoutes.get("/", getProposals);
proposalRoutes.post("/", validate(schema), postProposal);
