import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.get("/metrics", metrics);
router.post('/users/:id/ban', adminController.banUser);
router.post('/users/:id/unban', adminController.unbanUser);
router.post('/bounties/:id/approve', adminController.approveBounty);
router.post('/payouts/manual', adminController.processManualPayout);

module.exports = router;
