import cors from"cors";
import express from"express";
import helmet from"helmet";
import{createApiLimiter}from"./middleware/rateLimit.js";
import{errorHandler}from"./middleware/errorHandler.js";
import{authRoutes}from"./routes/authRoutes.js";
import{userRoutes}from"./routes/userRoutes.js";
export function createApp(){
  const app=express();
  app.use(helmet());
  app.use(cors());
  app.use(createApiLimiter());
  app.use(express.json());
  app.get("/health",(_,res)=>res.status(200).json({ok:true}));
  app.use("/api/auth",authRoutes);
  app.use("/api/users",userRoutes);
  app.use(errorHandler);
  return app;
}