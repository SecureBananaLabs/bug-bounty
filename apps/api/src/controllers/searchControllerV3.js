import{ok,fail}from"../utils/response.js";
export async function searchV3(req,res){const raw=req.query.q;if(!raw||!String(raw).trim())return fail(res,"Query q must not be blank",400);return ok(res,{results:[],query:String(raw).trim().slice(0,200)});}
