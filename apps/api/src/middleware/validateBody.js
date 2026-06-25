import{fail}from"../utils/response.js";
export function requireFields(fields){
  return(req,res,next)=>{
    for(const f of fields){
      const v=req.body?.[f];
      if(v===undefined||v===null||(typeof v==="string"&&!v.trim()))
        return fail(res,`Field "${f}" is required and must not be empty`,400);
    }
    return next();
  };
}
