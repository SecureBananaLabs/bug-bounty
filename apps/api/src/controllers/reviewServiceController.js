import{ok}from"../utils/response.js";
const snap=r=>r?{...r}:null;
export async function listReviews(_req,res){return ok(res,{reviews:[].map(snap)});}