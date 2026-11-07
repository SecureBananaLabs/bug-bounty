import cors from"cors";
import express from"express";
import helmet from"helmet";
import{createApiLimiter}from"./middleware/rateLimit.js";
import{errorHandler}from"./middleware/errorHandler.js";
export function createAppV2(){
  const app=express();
  app.use(helmet());
  app.use(cors());
  app.use(createApiLimiter());
  app.use(express.json({limit:"100kb"}));
  app.get("/health",(_,res)=>res.json({ok:true}));
  app.use(errorHandler);
  return app;
}