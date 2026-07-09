import{z}from"zod";import{fail}from"../utils/response.js";
const s=z.object({receiverId:z.string().min(1),content:z.string().min(1).max(2000).trim()});
export const msgEmptyV6=(req,res,next)=>{const r=s.safeParse(req.body);if(!r.success)return fail(res,"Invalid message payload",400);return next();};