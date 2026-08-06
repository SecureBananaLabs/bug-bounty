import{z}from"zod";import{fail}from"../utils/response.js";
const s=z.object({amount:z.number().positive(),currency:z.string().length(3).toUpperCase()});
export const validatePaymentIntent=(req,res,next)=>{const r=s.safeParse(req.body);if(!r.success)return fail(res,"Invalid payment intent: "+r.error.issues[0]?.message,400);return next();};