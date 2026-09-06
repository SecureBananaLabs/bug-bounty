import{fail}from"../utils/response.js";
const OK=new Set(["google","github"]);
export const oauthCheck=(req,res,next)=>{const p=(req.params?.provider||"").toLowerCase();if(!OK.has(p))return fail(res,"Unsupported provider",400);if(!req.query?.code?.trim())return fail(res,"OAuth code required",400);return next();};