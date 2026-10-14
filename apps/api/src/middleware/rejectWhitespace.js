import{fail}from"../utils/response.js";
export function rejectWhitespaceFields(fields){
  return(req,res,next)=>{
    for(const field of fields){
      const v=req.body?.[field];
      if(typeof v==="string"&&v.trim().length===0)
        return fail(res,`Field "${field}" must not be empty or whitespace-only`,400);
    }
    return next();
  };
}
