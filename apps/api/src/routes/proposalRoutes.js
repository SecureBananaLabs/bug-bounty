import { Router } from "express";
import { getProposals, postProposal } from "../controllers/proposalController.js";
import { methodNotAllowed } from "../middleware/methodNotAllowed.js";

export const proposalRoutes = Router();

proposalRoutes.route("/")
  .get(getProposals)
  .post(postProposal)
  .all(methodNotAllowed(["GET", "POST"]));
