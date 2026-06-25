import{ok,fail}from"../utils/response.js";
const MAX_QUERY_LEN=200;
export async function search(req,res){
  const raw=req.query.q;
  if(!raw||typeof raw!=="string") return fail(res,"Missing query parameter q",400);
  const q=raw.trim();
  if(!q) return fail(res,"Query must not be empty or whitespace",400);
  if(q.length>MAX_QUERY_LEN) return fail(res,`Query too long (max ${MAX_QUERY_LEN} chars)`,400);
  return ok(res,{results:[],query:q});
}
