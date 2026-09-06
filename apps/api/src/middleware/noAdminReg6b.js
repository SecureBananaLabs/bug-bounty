import{fail}from"../utils/response.js";
const PUB=new Set(["client","freelancer"]);
export const noAdminReg6b=(req,res,next)=>{if(req.body?.role&&!PUB.has(req.body.role))return fail(res,"Role not allowed",400);return next();};