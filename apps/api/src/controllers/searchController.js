import{ok,fail}from"../utils/response.js";
const MAX_Q=200;
export async function search(req,res){
  const q=req.query.q;
  if(!q||typeof q!=="string"||!q.trim()) return fail(res,"Query parameter q is required",400);
  if(q.length>MAX_Q) return fail(res,`Query must not exceed ${MAX_Q} characters`,400);
  return ok(res,{results:[],query:q.trim()});
}
