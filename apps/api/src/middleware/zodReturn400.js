import{fail}from"../utils/response.js";
export function zodReturn400(err,req,res,next){if(err?.name==="ZodError"||Array.isArray(err?.issues))return fail(res,"Validation failed",400);return next(err);}