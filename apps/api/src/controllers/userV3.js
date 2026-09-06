import{ok,fail}from"../utils/response.js";
const safe=u=>{const{password,passwordHash,...r}=u;return r;};
export async function createUser(req,res){const{name,email}=req.body||{};if(!name?.trim())return fail(res,"name required",400);if(!email?.trim())return fail(res,"email required",400);return ok(res,{user:safe({id:crypto.randomUUID(),name:name.trim(),email:email.toLowerCase()})},201);}