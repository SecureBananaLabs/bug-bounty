import{fail}from"../utils/response.js";
export const rejectOmittedFile=(req,res,next)=>{if(!req.file&&!req.files?.length)return fail(res,"Multipart file field is required",400);return next();};