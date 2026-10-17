import cors from "cors";
import express from "express";
import helmet from "helmet";
import { apiLimiter } from "./middleware/rateLimit.js";
import { errorHandler } from "./middleware/errorHandler.js";
// ... [rest of imports remain unchanged]

export function createApp() {
  const app = express();

  // Security header configuration
  app.use(helmet());
  
  // CORS configuration with environment-based origin control
  const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  };
  app.use(cors(corsOptions));

  // ... [rest of middleware remains unchanged]

  // Enhanced health check with security insights
  app.get("/health", (req, res) => {
    const securityStatus = {
      cors: {
        status: process.env.CORS_ORIGIN ? 'restricted' : 'UNSAFE',
        origin: process.env.CORS_ORIGIN || '*'
      }
    };
    res.status(200).json({ 
      ok: true, 
      service: "api",
      security: securityStatus
    });
  });

  // ... [rest of routes remain unchanged]
  app.use(errorHandler);
  return app;
}
