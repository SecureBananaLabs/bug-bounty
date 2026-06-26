import{ok,fail}from"../utils/response.js";
export async function jobWithCtx(req,res){const{id}=req.params;
const job={id,title:"Job "+id,detailUrl:`/jobs/${encodeURIComponent(id)}`,applyUrl:`/jobs/${encodeURIComponent(id)}/apply`};
return ok(res,{job});}