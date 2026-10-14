import{z}from"zod";import{fail}from"../utils/response.js";
const s=z.object({amount:z.number().positive(),currency:z.string().length(3)});
export const paymentValidate3=(req,res,next)=>{const r=s.safeParse(req.body);if(!r.success)return fail(res,"Invalid payment data",400);return next();};