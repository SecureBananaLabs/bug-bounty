import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  getDashboard,
  suspendUserController,
  reactivateUserController,
  banUserController,
  approveJobController,
  rejectJobController,
  escalateJobController,
  reviewDisputeController,
  resolveDisputeController,
  toggleRegistrationsController,
  toggleJobPostingsController,
} from "../controllers/adminController.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);

adminRoutes.get("/dashboard", getDashboard);
adminRoutes.post("/users/:userId/suspend", suspendUserController);
adminRoutes.post("/users/:userId/reactivate", reactivateUserController);
adminRoutes.post("/users/:userId/ban", banUserController);
adminRoutes.post("/jobs/:jobId/approve", approveJobController);
adminRoutes.post("/jobs/:jobId/reject", rejectJobController);
adminRoutes.post("/jobs/:jobId/escalate", escalateJobController);
adminRoutes.post("/disputes/:disputeId/review", reviewDisputeController);
adminRoutes.post("/disputes/:disputeId/resolve", resolveDisputeController);
adminRoutes.post("/controls/registrations", toggleRegistrationsController);
adminRoutes.post("/controls/job-postings", toggleJobPostingsController);