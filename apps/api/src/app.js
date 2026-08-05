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

export function createApp() {
  const app = express();

  // Hide framework fingerprint
  app.disable("x-powered-by");

  // Security headers via helmet (CSP, HSTS, X-Frame-Options, etc.)
  app.use(helmet());

  // --- CORS: strict origin allowlist ---
  // Only configured origins may make cross-origin requests from browsers.
  // Non-browser clients (curl, server-to-server) pass through when Origin is absent.
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
    : [];

  app.use(
    cors({
      origin(origin, callback) {
        // Non-browser requests (no Origin header) — allow
        if (!origin) {
          return callback(null, true);
        }
        // Browser request from a configured origin — allow
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        // Unknown origin — reject
        return callback(new Error("Not allowed by CORS"));
      },
      // Only expose the methods the API actually uses
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      // Only allow headers the API consumes
      allowedHeaders: ["Content-Type", "Authorization"],
      // Reflect credentials (cookies, Authorization header) from allowed origins
      credentials: true,
      // Cache preflight responses for 10 minutes to reduce OPTIONS spam
      maxAge: 600,
    })
  );

  app.use(express.json());
  app.use(apiLimiter);

  app.get("/health", (req, res) => {
    res.status(200).json({ ok: true, service: "api" });
  });

  // --- Route mounting ---
  // All mutation routes (POST/PUT/PATCH/DELETE) are protected by authMiddleware
  // at the route level. See each route file for the applied middleware chain.
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
