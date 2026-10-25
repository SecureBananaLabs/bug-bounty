import{fail}from"../utils/response.js";
export function jsonBodyErrorHandler(err,req,res,next){
  if(err?.type==="entity.parse.failed"||( err instanceof SyntaxError&&"body" in err)) return fail(res,"Invalid JSON body",400);
  if(err?.type==="entity.too.large") return fail(res,"Payload too large",413);
  return next(err);
}
