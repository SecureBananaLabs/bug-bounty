import{z}from"zod";import{fail}from"../utils/response.js";
const s=z.object({jobId:z.string().min(1),description:z.string().min(20).trim(),bidAmount:z.number().positive(),deliveryDays:z.number().int().positive()});
export const proposalValidate=(req,res,next)=>{const r=s.safeParse(req.body);if(!r.success)return fail(res,"Invalid proposal",400);return next();};