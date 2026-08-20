import { Router } from "express";
import { metrics, listUsers, moderateUser, listFlaggedJobs, moderateJob, listDisputes, resolveDispute, getAuditLog, getConfig, updateConfig } from "../controllers/adminController.js";
import { adminAuth } from "../middleware/adminAuth.js";

const router = Router();

// All admin routes require authentication + admin role
router.use(adminAuth);

// Metrics
router.get("/stats", metrics);

// User management
router.get("/users", listUsers);
router.patch("/users/:userId", moderateUser);

// Job moderation
router.get("/jobs/flagged", listFlaggedJobs);
router.post("/jobs/:jobId/moderate", moderateJob);

// Disputes
router.get("/disputes", listDisputes);
router.post("/disputes/:disputeId/resolve", resolveDispute);

// Audit log
router.get("/audit-log", getAuditLog);

// Platform config
router.get("/config", getConfig);
router.patch("/config", updateConfig);

export default router;
