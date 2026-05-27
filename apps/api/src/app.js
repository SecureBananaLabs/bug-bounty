import cors from "cors";
import express from "express";
import helmet from "helmet";
import { apiLimiter } from "./middleware/rateLimit.js";
import { authMiddleware } from "./middleware/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRoutes } from "./routes/authRoutes.js";
import { userRoutes } from "./routes/userRoutes.js";
import { jobRoutes } from "./routes/jobRoutes.js";
import { proposalRoutes } from "./routes/proposalRoutes.js";
import { paymentRoutes } from "./routes/paymentRoutes.js";
import { reviewRoutes } from "./routes/reviewRoutes.js";
import { messageRoutes } from "./routes/messageRoutes.js";
import { notificationRoutes } from "./routes/notificationRoutes.js";
import { uploadRoutes } from "./routes/uploadRoutes.js";
import { searchRoutes } from "./routes/searchRoutes.js";
import { adminRoutes } from "./routes/adminRoutes.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(apiLimiter);

  app.get("/health", (req, res) => {
    res.status(200).json({ ok: true, service: "api" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", authMiddleware, userRoutes);
  app.use("/api/jobs", authMiddleware, jobRoutes);
  app.use("/api/proposals", authMiddleware, proposalRoutes);
  app.use("/api/payments", authMiddleware, paymentRoutes);
  app.use("/api/reviews", authMiddleware, reviewRoutes);
  app.use("/api/messages", authMiddleware, messageRoutes);
  app.use("/api/notifications", authMiddleware, notificationRoutes);
  app.use("/api/uploads", authMiddleware, uploadRoutes);
  app.use("/api/search", authMiddleware, searchRoutes);
  app.use("/api/admin", adminRoutes);

  app.use(errorHandler);
  return app;
}
