import{ok,fail}from"../utils/response.js";
export async function freelancerWithCtx(req,res){const{userId}=req.params;
const profile={id:userId,name:"Freelancer "+userId,profileUrl:`/freelancers/${encodeURIComponent(userId)}`,contactUrl:`/freelancers/${encodeURIComponent(userId)}/contact`};
return ok(res,{profile});}