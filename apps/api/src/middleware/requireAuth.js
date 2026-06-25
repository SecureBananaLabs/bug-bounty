import jwt from"jsonwebtoken";
import{fail}from"../utils/response.js";
export function requireAuth(req,res,next){
  const auth=req.headers.authorization;
  if(!auth?.startsWith("Bearer ")) return fail(res,"Authentication required",401);
  try{
    req.user=jwt.verify(auth.slice(7),process.env.JWT_SECRET||"secret");
    return next();
  }catch{
    return fail(res,"Invalid or expired token",401);
  }
}
