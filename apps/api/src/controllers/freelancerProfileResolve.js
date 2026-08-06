import{ok,fail}from"../utils/response.js";
const MOCK=new Map([["1",{id:"1",name:"Alice",skills:["React","Node.js"],rating:4.9}],["2",{id:"2",name:"Bob",skills:["Python","Django"],rating:4.7}]]);
export async function getFreelancerProfile(req,res){const p=MOCK.get(String(req.params.userId||req.params.id));if(!p)return fail(res,"Freelancer not found",404);return ok(res,{profile:p});}