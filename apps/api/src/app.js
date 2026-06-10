import cors from "cors";
import express from "express";
import helmet from "helmet";
import { apiLimiter } from "./middleware/rateLimit.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRoutes } from "./routes/authRoutes.js";
import { jobRoutes } from "./routes/jobRoutes.js";
import { userRoutes } from "./routes/userRoutes.js";
import { paymentRoutes } from "./routes/paymentRoutes.js";
import { proposalRoutes } from "./routes/proposalRoutes.js";
import { reviewRoutes } from "./routes/reviewRoutes.js";
import { searchRoutes } from "./routes/searchRoutes.js";
import { messageRoutes } from "./routes/messageRoutes.js";
import { notificationRoutes } from "./routes/notificationRoutes.js";
import { uploadRoutes } from "./routes/uploadRoutes.js";

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(",") 
  : ["http://localhost:3000", "https://secure-banana.com"];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  optionsSuccessStatus: 200
};

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json());

  app.use("/api/auth", authRoutes);
  app.use("/api/jobs", jobRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/proposals", proposalRoutes);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/search", searchRoutes);
  app.use("/api/messages", messageRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/uploads", uploadRoutes);

  app.use(errorHandler);

  return app;
}
