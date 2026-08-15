import{fail}from"../utils/response.js";
const PUB=new Set(["client","freelancer"]);
export const restrictPublicRoleV2=(req,res,next)=>{const r=req.body?.role;if(r&&!PUB.has(r))return fail(res,`Role "${r}" cannot be assigned via public registration`,400);return next();};