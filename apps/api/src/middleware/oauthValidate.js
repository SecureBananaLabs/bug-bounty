import{fail}from"../utils/response.js";
const OK=new Set(["google","github"]);
export const oauthValidate=(req,res,next)=>{const p=req.params?.provider;if(!p||!OK.has(p.toLowerCase()))return fail(res,"Unsupported provider",400);const{code}=req.query;if(!code?.trim())return fail(res,"Missing OAuth code",400);return next();};