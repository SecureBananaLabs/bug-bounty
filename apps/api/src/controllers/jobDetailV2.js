import{ok,fail}from"../utils/response.js";
const J=new Map([["1",{id:"1",title:"Backend Engineer",status:"OPEN"}],["2",{id:"2",title:"Frontend Dev",status:"OPEN"}]]);
export async function getJobV2(req,res){const j=J.get(req.params.id);if(!j)return fail(res,"Not found",404);return ok(res,{job:j});}