import{fail}from"../utils/response.js";
const PUB=new Set(["client","freelancer"]);
export const noAdminReg5=(req,res,next)=>{if(req.body?.role&&!PUB.has(req.body.role))return fail(res,"Admin role cannot be self-assigned",400);return next();};