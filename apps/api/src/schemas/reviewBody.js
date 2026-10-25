import{z}from"zod";import{fail}from"../utils/response.js";
const s=z.object({targetId:z.string().min(1),rating:z.number().int().min(1).max(5),comment:z.string().min(10).max(1000).trim().optional()});
export const validateReviewBody=(req,res,next)=>{const r=s.safeParse(req.body);if(!r.success)return fail(res,"Invalid review body",400);return next();};