import{fail}from"../utils/response.js";
export function validateBudgetRange(req,res,next){
  const b=req.body?.budget;
  if(b&&typeof b==="object"&&typeof b.min==="number"&&typeof b.max==="number"&&b.min>=b.max)
    return fail(res,"budget.max must be greater than budget.min",400);
  return next();
}
