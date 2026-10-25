import{fail}from"../utils/response.js";
const ALLOWED=new Set(["google","github","facebook","apple"]);
export const oauthWhitelist=(req,res,next)=>{const p=req.params?.provider||req.query?.provider;if(!p||!ALLOWED.has(p.toLowerCase()))return fail(res,`Unsupported OAuth provider: "${p}"`,400);return next();};