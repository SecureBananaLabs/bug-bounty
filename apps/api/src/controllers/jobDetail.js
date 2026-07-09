import{ok,fail}from"../utils/response.js";
const JOBS=[{id:"job-1",title:"Senior TypeScript Dev",status:"OPEN"},{id:"job-2",title:"React Engineer",status:"OPEN"}];
export async function getJob(req,res){const job=JOBS.find(j=>j.id===req.params.id);if(!job)return fail(res,"Job not found",404);return ok(res,{job});}