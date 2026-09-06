import{fail}from"../utils/response.js";
export function requireAdmin(req,res,next){
  if(!req.user) return fail(res,"Authentication required",401);
  if(req.user.role!=="admin") return fail(res,"Admin role required",403);
  return next();
}
