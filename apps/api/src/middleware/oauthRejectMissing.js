import{fail}from"../utils/response.js";
const PROVIDERS=new Set(["google","github","facebook"]);
export const oauthRejectMissing=(req,res,next)=>{const p=req.params?.provider||req.query?.provider;if(!p||!PROVIDERS.has(p.toLowerCase()))return fail(res,"Unsupported OAuth provider",400);if(!req.query?.code?.trim())return fail(res,"Missing OAuth authorization code",400);return next();};