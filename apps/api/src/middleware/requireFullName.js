import{z}from"zod";import{fail}from"../utils/response.js";
const s=z.object({fullName:z.string().min(2).max(100).trim(),email:z.string().email(),password:z.string().min(8)});
export const requireFullName=(req,res,next)=>{const r=s.safeParse(req.body);if(!r.success)return fail(res,"Registration requires fullName, email, password",400);return next();};