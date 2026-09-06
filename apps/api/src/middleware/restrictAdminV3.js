import{fail}from"../utils/response.js";
const PUB=new Set(["client","freelancer"]);
export const restrictAdminV3=(req,res,next)=>{const r=req.body?.role;if(r&&!PUB.has(r))return fail(res,"Role not allowed in public registration",400);return next();};