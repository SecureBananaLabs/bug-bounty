import cors from"cors";
const ALLOWED=process.env.CORS_ORIGIN?process.env.CORS_ORIGIN.split(",").map(s=>s.trim()):["http://localhost:3000"];
export const corsMiddleware=cors({
  origin:(origin,cb)=>{
    if(!origin||ALLOWED.includes(origin)) return cb(null,true);
    cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials:true,
});
