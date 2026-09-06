import{ok,fail}from"../utils/response.js";
const JOBS=[{id:"1",title:"Senior Dev",budget:{min:5000,max:8000}},{id:"2",title:"React Dev",budget:{min:3000,max:5000}}];
export async function getJobById(req,res){const job=JOBS.find(j=>j.id===req.params.id);if(!job)return fail(res,"Job not found",404);return ok(res,{job});}