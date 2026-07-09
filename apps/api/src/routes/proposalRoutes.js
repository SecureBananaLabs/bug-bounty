import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getProposals, postProposal } from "../controllers/proposalController.js";


const proposalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  message: { error: "Too many requests. Try again later." },
});

export const proposalRoutes = Router();

proposalRoutes.get("/", getProposals);
proposalRoutes.post("/", proposalLimiter, postProposal);
