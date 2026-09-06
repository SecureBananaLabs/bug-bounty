import{ok,fail}from"../utils/response.js";
const DB=new Map([["j1",{id:"j1",title:"Senior Dev",status:"OPEN"}]]);
export async function getJobDetail(req,res){const j=DB.get(req.params.id);if(!j)return fail(res,"Job not found",404);return ok(res,{job:j});}