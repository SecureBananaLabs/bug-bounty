import autocannon from "autocannon";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { apiLimiter } from "./middleware/rateLimit.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRoutes } from "./routes/authRoutes.js";
import { userRoutes } from "./routes/userRoutes.js";
import { jobRoutes } from "./routes/jobRoutes.js";
import { proposalRoutes } from "./routes/proposalRoutes.js";

export function createApp() {
  const app = express();
  const fs = require('fs');

  app.use(helmet());
  app.use(cors());
import { adminRoutes } from "./routes/adminRoutes.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(apiLimiter);
    res.status(200).json({ ok: true, service: "api" });
  });

  // Health check for benchmark
  app.get("/health/deep", async (req, res) => {
    // In a real implementation, this would do deeper checks
    res.status(200).json({ ok: true, service: "api", timestamp: new Date().toISOString() });
  });

  // Benchmark endpoint
  app.get("/benchmark", async (req, res) => {
    const results = await runBenchmark();
    res.status(200).json({
      ok: true,
      benchmark: results
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/jobs", jobRoutes);
  app.use("/api/users", userRoutes);
  app.use(errorHandler);
  return app;
}

async function runBenchmark() {
  // This would integrate with the benchmarking tool
  // Returning mock data for now
  return { message: "Benchmark results would appear here" };
}
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/messages", messageRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/uploads", uploadRoutes);
  app.use("/api/search", searchRoutes);
  app.use("/api/admin", adminRoutes);

  app.use(errorHandler);
  return app;
}
