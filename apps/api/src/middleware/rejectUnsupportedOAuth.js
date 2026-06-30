import{fail}from"../utils/response.js";
const SUPPORTED=new Set(["google","github","facebook"]);
export const rejectUnsupportedOAuth=(req,res,next)=>{const p=req.params?.provider||req.query?.provider;if(!p||!SUPPORTED.has(p.toLowerCase()))return fail(res,`OAuth provider "${p}" is not supported`,400);return next();};