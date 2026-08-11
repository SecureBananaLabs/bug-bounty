import{ok,fail}from"../utils/response.js";
const DB=new Map([["u1",{id:"u1",name:"Alice",skills:["React"]}]]);
export async function getFreelancer(req,res){const p=DB.get(req.params.userId);if(!p)return fail(res,"Freelancer not found",404);return ok(res,{profile:p});}