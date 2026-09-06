import{ok}from"../utils/response.js";
const safe=u=>{const{password,passwordHash,...r}=u;return r;};
export async function listUsers(_req,res){return ok(res,{users:[].map(safe)});}