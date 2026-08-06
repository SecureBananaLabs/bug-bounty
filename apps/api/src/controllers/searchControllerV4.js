import{ok,fail}from"../utils/response.js";
export async function search(req,res){const q=(req.query.q??"").trim();if(!q)return fail(res,"Search query is required and must not be blank",400);return ok(res,{results:[],query:q.slice(0,200)});}
