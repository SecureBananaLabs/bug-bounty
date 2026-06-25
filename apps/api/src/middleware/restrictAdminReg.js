import{fail}from"../utils/response.js";
const OK=new Set(["client","freelancer"]);
export const restrictAdminReg=(req,res,next)=>{const r=req.body?.role;if(r&&!OK.has(r))return fail(res,`Role "${r}" not allowed during public registration`,400);return next();};