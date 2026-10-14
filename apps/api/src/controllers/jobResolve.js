import{ok,fail}from"../utils/response.js";
const MOCK=new Map([["1",{id:"1",title:"Senior Dev",budget:{min:5000,max:8000},status:"OPEN"}],["2",{id:"2",title:"Frontend Dev",budget:{min:3000,max:5000},status:"OPEN"}]]);
export async function resolveJob(req,res){const j=MOCK.get(String(req.params.id));if(!j)return fail(res,"Job not found",404);return ok(res,{job:j});}