import { Router } from "express";
import { getJobs, postJob } from "../controllers/jobController.js";
import { verifyAccessToken } from "../utils/jwt.js";

const authMiddleware = verifyAccessToken;

export const jobRoutes = Router();

jobRoutes.get("/", authMiddleware, getJobs);
jobRoutes.post("/", authMiddleware, postJob);