import{fail}from"../utils/response.js";
export function validateBudgetRange(req,res,next){
  const{budget}=req.body||{};
  if(budget&&typeof budget==="object"){
    const{min,max}=budget;
    if(typeof min==="number"&&typeof max==="number"&&min>=max)
      return fail(res,"budget.max must be greater than budget.min",400);
  }
  return next();
}
