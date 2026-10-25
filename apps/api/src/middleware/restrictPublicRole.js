import{fail}from"../utils/response.js";
const PUBLIC_ROLES=new Set(["client","freelancer"]);
export function restrictPublicRole(req,res,next){
  const role=req.body?.role;
  if(role!==undefined&&!PUBLIC_ROLES.has(role))
    return fail(res,`Role "${role}" is not allowed for public registration`,400);
  return next();
}
