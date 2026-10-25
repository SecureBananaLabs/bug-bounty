import{ok,fail}from"../utils/response.js";
export async function search(req,res){
  const q=(req.query.q||"").trim();
  if(!q) return fail(res,"Query parameter q is required and must not be blank",400);
  if(q.length>200) return fail(res,"Query too long (max 200 chars)",400);
  return ok(res,{results:[],query:q});
}
