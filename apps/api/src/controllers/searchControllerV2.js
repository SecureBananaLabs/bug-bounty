import{ok,fail}from"../utils/response.js";
export async function searchV2(req,res){const q=(req.query.q||"").trim();if(!q)return fail(res,"q is required",400);if(q.length>200)return fail(res,"q too long",400);return ok(res,{results:[],q});}
