import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { adminGuard } from "../middleware/adminGuard.js";
import {
  metrics,
  getUsers,
  patchUserStatus,
  getUserDetails,
  getFlaggedJobs,
  patchJobFlag,
  getDisputes,
  getDisputeDetails,
  patchDispute,
  getLogs,
  getSettings,
  patchSettings,
} from "../controllers/adminController.js";

const adminRouter = Router({ mergeParams: true });

adminRouter.use(authMiddleware);
adminRouter.use(adminGuard);

adminRouter.get("/metrics", metrics);

adminRouter.get("/users", getUsers);
adminRouter.get("/users/:userId", getUserDetails);
adminRouter.patch("/users/:userId/status", patchUserStatus);

adminRouter.get("/jobs/flagged", getFlaggedJobs);
adminRouter.patch("/jobs/:jobId/flag", patchJobFlag);

adminRouter.get("/disputes", getDisputes);
adminRouter.get("/disputes/:disputeId", getDisputeDetails);
adminRouter.patch("/disputes/:disputeId", patchDispute);

adminRouter.get("/audit-logs", getLogs);

adminRouter.get("/settings", getSettings);
adminRouter.patch("/settings", patchSettings);

export { adminRouter };
export default adminRouter;
