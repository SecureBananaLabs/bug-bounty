import cors from "cors";
import express from "express";
import helmet from "helmet";
import { apiLimiter } from "./middleware/rateLimit.js";
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
import { env } from "./config/env.js";

export function createApp() {
  const app = express();

  const corsOptions = {
    origin: (origin, callback) => {
      // allow requests with no origin (such as mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      if (env.corsOrigins.includes("*") || env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      const err = new Error("Not allowed by CORS");
      err.status = 403;
      return callback(err);
    }
  };

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json());

  app.get("/health", (req, res) => {
    res.status(200).json({ ok: true, service: "api" });
  });

  app.use(apiLimiter);

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/jobs", jobRoutes);
  app.use("/api/proposals", proposalRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/messages", messageRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/uploads", uploadRoutes);
  app.use("/api/search", searchRoutes);
  app.use("/api/admin", adminRoutes);

  app.use(errorHandler);
  return app;
}
