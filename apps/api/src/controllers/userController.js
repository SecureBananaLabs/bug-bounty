import{ok,fail}from"../utils/response.js";
function sanitizeUser(user){
  if(!user) return null;
  const{password,passwordHash,salt,...safe}=user;
  return safe;
}
export async function createUser(req,res){
  const{name,email}=req.body||{};
  if(!name?.trim()) return fail(res,"name is required",400);
  if(!email?.trim()) return fail(res,"email is required",400);
  const user={id:"stub",name:name.trim(),email:email.toLowerCase()};
  return ok(res,{user:sanitizeUser(user)},201);
}
