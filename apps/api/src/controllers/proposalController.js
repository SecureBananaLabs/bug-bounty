import{ok,fail}from"../utils/response.js";
function snapshot(p){return p?{...p}:null;}
export async function listProposals(req,res){
  return ok(res,{proposals:[].map(snapshot)});
}
export async function getProposal(req,res){
  return ok(res,{proposal:snapshot({id:req.params.id})});
}
