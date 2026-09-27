import { Router } from "express";
import { readiness } from "../controllers/healthController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const healthRoutes = Router();

// Liveness: the process is up. Kept at /health for backward compatibility.
healthRoutes.get("/", (req, res) => {
  res.status(200).json({ ok: true, service: "api" });
});

// Readiness: dependencies are reachable, so traffic can be routed here.
healthRoutes.get("/ready", asyncHandler(readiness));
