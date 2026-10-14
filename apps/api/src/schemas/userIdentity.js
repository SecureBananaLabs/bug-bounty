import{z}from"zod";import{fail}from"../utils/response.js";
const s=z.object({name:z.string().min(1).max(100).trim(),email:z.string().email(),password:z.string().min(8)});
export const userIdentity=(req,res,next)=>{const r=s.safeParse(req.body);if(!r.success)return fail(res,"User creation requires name, valid email, and password",400);return next();};