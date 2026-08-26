import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
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

export function createApp() {
  const app = express();

  // Build the CORS allowlist from the CORS_ORIGINS env var (comma-separated).
  const allowedOrigins = env.corsOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(helmet());
  app.use(
    cors({
      // Reflect only explicitly allowed origins. Requests without an Origin
      // header (same-origin, server-to-server, health checks) are permitted;
      // any cross-origin request is denied unless its origin is in the
      // allowlist. An empty allowlist denies ALL cross-origin traffic, which
      // is the safe default for production.
      origin(origin, callback) {
        if (!origin) {
          return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
    }),
  );
  app.use(express.json());
  app.use(apiLimiter);

  app.get("/health", (req, res) => {
    res.status(200).json({ ok: true, service: "api" });
  });

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
