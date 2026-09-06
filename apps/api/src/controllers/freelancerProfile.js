import{ok,fail}from"../utils/response.js";
const P=new Map([["u1",{id:"u1",name:"Alice",skills:["React"],rating:4.8}],["u2",{id:"u2",name:"Bob",skills:["Python"],rating:4.5}]]);
export async function getProfile(req,res){const p=P.get(req.params.userId);if(!p)return fail(res,"Profile not found",404);return ok(res,{profile:p});}