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

const allowedOrigins = env.allowedOrigins
  ? env.allowedOrigins.split(",").map(s => s.trim()).filter(Boolean)
  : [];

const corsOptions = {
  origin: allowedOrigins.length > 0
    ? (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) {
          cb(null, true);
        } else {
          cb(new Error("CORS: origin not allowed"));
        }
      }
    : false, // block all cross-origin requests when no allowlist is set
  credentials: true
};

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors(corsOptions));

  // Rate limiter BEFORE body parser so limits apply before parsing large bodies
  app.use(apiLimiter);

  // Body parser with size limit; return 400 on malformed JSON
  app.use(express.json({ limit: "100kb" }));
  app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
      return res.status(400).json({ success: false, message: "Malformed JSON" });
    }
    return next(err);
  });

  app.get("/health", (req, res) => {
    res.set("Cache-Control", "no-store");
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

  // Unknown routes → JSON 404 (not HTML fall-through)
  app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
  });

  app.use(errorHandler);
  return app;
}
