import{fail}from"../utils/response.js";
export function jsonErrorHandler(err,req,res,next){
  if(err instanceof SyntaxError&&err.status===400&&"body"in err)
    return fail(res,"Malformed JSON in request body",400);
  if(err.type==="entity.too.large")
    return fail(res,"Request body too large",413);
  return next(err);
}
