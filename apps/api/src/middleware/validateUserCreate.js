import{z}from"zod";import{fail}from"../utils/response.js";
const schema=z.object({name:z.string().min(1).max(100).trim(),email:z.string().email(),password:z.string().min(8)});
export const validateUserCreate=(req,res,next)=>{const r=schema.safeParse(req.body);if(!r.success)return fail(res,"Validation failed",400);return next();};