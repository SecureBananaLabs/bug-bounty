import{fail}from"../utils/response.js";
const PUB=new Set(["client","freelancer"]);
export const preventAdminSelfAssign=(req,res,next)=>{const r=req.body?.role;if(r&&!PUB.has(r))return fail(res,`Role "${r}" not allowed`,400);return next();};