import{fail}from"../utils/response.js";
const ALLOWED=new Set(["client","freelancer"]);
export function restrictPublicRole(req,res,next){
  const role=req.body?.role;
  if(role!==undefined&&!ALLOWED.has(role)) return fail(res,`Role "${role}" not allowed for public registration`,400);
  return next();
}
