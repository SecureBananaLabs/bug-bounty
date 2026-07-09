import{fail}from"../utils/response.js";
const OK_PROVIDERS=new Set(["google","github"]);
export const rejectUnsupportedOAuthV2=(req,res,next)=>{const p=req.params?.provider;if(!p||!OK_PROVIDERS.has(p.toLowerCase()))return fail(res,`Provider "${p}" is not supported`,400);return next();};