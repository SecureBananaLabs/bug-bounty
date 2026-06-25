import{ok}from"../utils/response.js";
const snap=p=>p?{...p}:null;
export async function listProposals(_req,res){return ok(res,{proposals:[].map(snap)});}
export async function getProposal(req,res){return ok(res,{proposal:snap({id:req.params.id})});}
