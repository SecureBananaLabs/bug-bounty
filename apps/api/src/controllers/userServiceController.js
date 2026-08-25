import{ok}from"../utils/response.js";
const safe=u=>{if(!u)return null;const{password,passwordHash,salt,...r}=u;return{...r};};
export async function listUsers(_req,res){return ok(res,{users:[].map(safe)});}