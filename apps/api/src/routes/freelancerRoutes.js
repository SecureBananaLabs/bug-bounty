import { Router } from "express";
import { getFreelancer } from "../controllers/freelancerController.js";

export const freelancerRoutes = Router();

freelancerRoutes.get("/:usernameOrId", getFreelancer);
