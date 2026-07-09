import jwt from"jsonwebtoken";
import{fail}from"../utils/response.js";
export const requireAuthJobs=(req,res,next)=>{const h=req.headers.authorization;if(!h?.startsWith("Bearer "))return fail(res,"Authentication required to create jobs",401);try{req.user=jwt.verify(h.slice(7),process.env.JWT_SECRET||"secret");return next();}catch{return fail(res,"Invalid or expired token",401);}};