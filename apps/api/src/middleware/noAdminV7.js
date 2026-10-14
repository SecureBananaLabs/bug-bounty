import{fail}from"../utils/response.js";
const PUB=new Set(["client","freelancer"]);
export const noAdminV7=(req,res,next)=>{if(req.body?.role&&!PUB.has(req.body.role))return fail(res,"Role not allowed in registration",400);return next();};