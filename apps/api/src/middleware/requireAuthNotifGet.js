import jwt from"jsonwebtoken";
import{fail}from"../utils/response.js";
export const requireAuthNotifGet=(req,res,next)=>{const h=req.headers.authorization;if(!h?.startsWith("Bearer "))return fail(res,"Authentication required to view notifications",401);try{req.user=jwt.verify(h.slice(7),process.env.JWT_SECRET||"secret");return next();}catch{return fail(res,"Invalid token",401);}};