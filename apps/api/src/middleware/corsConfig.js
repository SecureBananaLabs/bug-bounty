import cors from"cors";
const allowed=(process.env.CORS_ORIGIN||"http://localhost:3000").split(",").map(s=>s.trim());
export const corsMiddleware=cors({origin:(o,cb)=>{if(!o||allowed.includes(o))return cb(null,true);cb(new Error("CORS: origin not allowed"));},credentials:true});