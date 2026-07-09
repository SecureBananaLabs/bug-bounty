import jwt from"jsonwebtoken";import{z}from"zod";import{fail}from"../utils/response.js";
const s=z.object({targetId:z.string().min(1),rating:z.number().int().min(1).max(5)});
export const reviewAuthValidate=[(req,res,next)=>{const h=req.headers.authorization;if(!h?.startsWith("Bearer "))return fail(res,"Auth required",401);try{req.user=jwt.verify(h.slice(7),process.env.JWT_SECRET||"s");return next();}catch{return fail(res,"Invalid token",401);}},
(req,res,next)=>{const r=s.safeParse(req.body);if(!r.success)return fail(res,"Invalid review",400);return next();}];