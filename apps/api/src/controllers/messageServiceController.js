import{ok}from"../utils/response.js";
const snap=m=>m?{...m}:null;
export async function listMessages(_req,res){return ok(res,{messages:[].map(snap)});}